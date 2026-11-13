/**
 * What the payment Edge Functions do, apart from Deno and HTTP: start a
 * payment for an order, act on what Stripe reports, refund a cancelled
 * order. The database decides who may do what (0036); amounts always come
 * from the order the server priced, never from the app. Kept free of
 * Deno APIs so the unit tests can run it with stand-ins for Stripe and the
 * database (tests/unit/paymentFunctions.test.ts).
 */

/** The Supabase client's rpc(), as the service role. */
export type Db = {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: DbError | null }>;
};
export type DbError = { message: string; code?: string };

type PaymentIntent = {
  id: string;
  client_secret: string | null;
  status: string;
  amount: number;
  amount_received?: number;
  metadata?: Record<string, string>;
};

/** The parts of the Stripe client used here. */
export type StripeApi = {
  paymentIntents: {
    create(params: Record<string, unknown>, options?: { idempotencyKey?: string }): Promise<PaymentIntent>;
    retrieve(id: string): Promise<PaymentIntent>;
  };
  refunds: {
    create(params: { payment_intent: string }, options?: { idempotencyKey?: string }): Promise<{ id: string }>;
  };
};

/** The order fields these functions use. */
type Order = {
  id: string;
  user_id: string;
  status: string;
  total_cents: number;
  stripe_payment_intent_id: string | null;
  refund_status: string | null;
};

/** A refusal with a message that's safe to show, and its HTTP status. */
export class PaymentError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/** A database error as a PaymentError: its message when it's one of ours, a generic one otherwise. */
function fromDb(error: DbError, fallback: string): PaymentError {
  if (error.code === 'P0002') return new PaymentError(error.message, 404);
  if (error.code === '22023') return new PaymentError(error.message, 400);
  return new PaymentError(fallback, 500);
}

async function call<T>(db: Db, fn: string, args: Record<string, unknown>, fallback: string): Promise<T> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw fromDb(error, fallback);
  return data as T;
}

/** A PaymentIntent the payment sheet can still use. */
const OPEN = ['requires_payment_method', 'requires_confirmation', 'requires_action'];

/**
 * Starts (or picks up again) the payment for a draft order of the user's:
 * a PaymentIntent for exactly the order's total, in euros, with the
 * methods switched on in the Stripe Dashboard (card, Apple Pay, Google
 * Pay, Bancontact). Returns the client secret the payment sheet needs.
 */
export async function startPayment(
  deps: { db: Db; stripe: StripeApi },
  userId: string,
  orderId: string,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const fallback = 'Couldn’t start the payment. Try again.';
  const order = await call<Order>(deps.db, 'order_for_payment', { p_order_id: orderId, p_user_id: userId }, fallback);

  if (order.stripe_payment_intent_id) {
    const existing = await deps.stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
    if (existing.status === 'succeeded' || existing.status === 'processing') {
      throw new PaymentError('This order is already paid.', 409);
    }
    if (OPEN.includes(existing.status) && existing.amount === order.total_cents && existing.client_secret) {
      return { clientSecret: existing.client_secret, paymentIntentId: existing.id };
    }
  }

  const intent = await deps.stripe.paymentIntents.create(
    {
      amount: order.total_cents,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      description: `Mongmo order ${order.id.slice(0, 8)}`,
      metadata: { order_id: order.id, user_id: userId },
    },
    // One PaymentIntent per order and total, however often the app asks.
    { idempotencyKey: `order-${order.id}-${order.total_cents}` },
  );
  if (!intent.client_secret) throw new PaymentError(fallback, 502);
  await call(deps.db, 'attach_payment_intent', { p_order_id: order.id, p_intent_id: intent.id }, fallback);
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}

/** A Stripe event, as verified by the webhook. */
export type StripeEvent = { id: string; type: string; data: { object: Record<string, unknown> } };

/** Outcomes someone should look at: the webhook logs these as errors. */
export const NEEDS_ATTENTION = ['dispute opened', 'refund failed'];

/**
 * Handles a verified Stripe event once. Stripe sends an event again when
 * it gets no answer, and now and then twice anyway: one already handled is
 * answered "duplicate" and nothing runs. It's recorded only after it was
 * handled, so one that failed is still handled when Stripe sends it again.
 */
export async function processStripeEvent(deps: { db: Db; stripe: StripeApi }, event: StripeEvent): Promise<string> {
  const seen = await deps.db.rpc('stripe_event_seen', { p_event_id: event.id });
  if (seen.error) throw new Error(`stripe_event_seen: ${seen.error.message}`);
  if (seen.data === true) return 'duplicate';

  const outcome = await handleStripeEvent(deps, event);

  const recorded = await deps.db.rpc('record_stripe_event', {
    p_event_id: event.id,
    p_type: event.type,
    p_outcome: outcome,
  });
  if (recorded.error) throw new Error(`record_stripe_event: ${recorded.error.message}`);
  return outcome;
}

/**
 * Acts on a verified Stripe event. A payment that succeeded pays (and
 * places) its order; one for an order that's gone or cancelled is refunded
 * straight away. Refund results update the order. Throws on database
 * errors, so the webhook answers 500 and Stripe sends the event again.
 */
export async function handleStripeEvent(deps: { db: Db; stripe: StripeApi }, event: StripeEvent): Promise<string> {
  const object = event.data.object;
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = object as unknown as PaymentIntent;
      const orderId = intent.metadata?.order_id;
      if (!orderId) return 'ignored: not an order payment';
      const { data, error } = await deps.db.rpc('mark_order_paid', {
        p_intent_id: intent.id,
        p_order_id: orderId,
        p_amount_cents: intent.amount_received ?? intent.amount,
      });
      if (error) throw new Error(`mark_order_paid: ${error.message}`);
      if (data === null || data === 'cancelled') {
        // Paid for an order that no longer exists or was cancelled: give it back.
        await deps.stripe.refunds.create({ payment_intent: intent.id }, { idempotencyKey: `refund-${intent.id}` });
        await setRefundStatus(deps.db, intent.id, 'pending');
        return 'refunded: order gone or cancelled';
      }
      return 'paid';
    }
    case 'charge.refunded': {
      const intentId = object.payment_intent;
      if (typeof intentId !== 'string' || object.refunded !== true) return 'ignored: partial or no refund';
      await setRefundStatus(deps.db, intentId, 'refunded');
      return 'refunded';
    }
    case 'refund.failed':
    case 'charge.refund.updated': {
      const intentId = object.payment_intent;
      if (typeof intentId !== 'string' || object.status !== 'failed') return 'ignored: refund not failed';
      await setRefundStatus(deps.db, intentId, 'failed');
      return 'refund failed';
    }
    case 'payment_intent.payment_failed':
      // The order stays a draft and the payment sheet tells the customer,
      // who can try again or pay at pickup: nothing to change here.
      return 'payment failed';
    case 'charge.dispute.created':
      // A customer's bank is taking the money back. It's answered in the
      // Stripe Dashboard, before the deadline Stripe emails: logged as an
      // error so it isn't missed.
      return 'dispute opened';
    default:
      return `ignored: ${event.type}`;
  }
}

async function setRefundStatus(db: Db, intentId: string, status: 'pending' | 'refunded' | 'failed'): Promise<void> {
  const { error } = await db.rpc('set_refund_status', { p_intent_id: intentId, p_status: status });
  if (error) throw new Error(`set_refund_status: ${error.message}`);
}

/** How often one person may call a payment function: plenty for real use, not for a script. */
const CALL_LIMIT = { max: 10, windowSeconds: 60 };

/** Counts this call against the person's limit for the action; refuses once they're over it. */
export async function allowCall(db: Db, userId: string, action: string, limit = CALL_LIMIT): Promise<void> {
  const { data, error } = await db.rpc('take_rate_limit', {
    p_user_id: userId,
    p_action: action,
    p_max: limit.max,
    p_window_seconds: limit.windowSeconds,
  });
  if (error) throw new Error(`take_rate_limit: ${error.message}`);
  if (data !== true) throw new PaymentError('Too many tries. Wait a minute and try again.', 429);
}

/**
 * Refunds a cancelled order that was paid online, for its customer or for
 * staff. Stripe never refunds more than was paid, so asking twice is safe.
 */
export async function refundOrder(deps: { db: Db; stripe: StripeApi }, userId: string, orderId: string): Promise<void> {
  const fallback = 'Couldn’t start the refund. Try again.';
  const order = await call<Order>(deps.db, 'order_for_refund', { p_order_id: orderId, p_user_id: userId }, fallback);
  const intentId = order.stripe_payment_intent_id;
  if (!intentId) throw new PaymentError('That order has no refund to make', 404);
  try {
    // A retry after a failure needs a new key: Stripe replays a key's first answer.
    const key = order.refund_status === 'failed' ? `refund-${intentId}-${Date.now()}` : `refund-${intentId}`;
    await deps.stripe.refunds.create({ payment_intent: intentId }, { idempotencyKey: key });
  } catch (error) {
    // Already refunded (another attempt got there first) is a success.
    if ((error as { code?: string }).code === 'charge_already_refunded') return;
    await setRefundStatus(deps.db, intentId, 'failed');
    throw new PaymentError(fallback, 502);
  }
  await setRefundStatus(deps.db, intentId, 'pending');
}
