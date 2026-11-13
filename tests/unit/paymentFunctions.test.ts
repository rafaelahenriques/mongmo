import {
  handleStripeEvent,
  PaymentError,
  refundOrder,
  startPayment,
  type Db,
  type StripeApi,
} from '../../supabase/functions/_shared/payments';

/**
 * The payment Edge Functions' logic (supabase/functions/_shared/payments.ts),
 * with stand-ins for Stripe and the database: nothing is charged.
 */
const ORDER = {
  id: '11111111-2222-3333-4444-555555555555',
  user_id: 'user-1',
  status: 'draft',
  total_cents: 1550,
  stripe_payment_intent_id: null as string | null,
  refund_status: null as string | null,
};

function fakes(answers: Record<string, { data?: unknown; error?: { message: string; code?: string } }> = {}) {
  const db = {
    rpc: jest.fn(async (fn: string) => {
      const answer = answers[fn] ?? {};
      return { data: answer.data ?? null, error: answer.error ?? null };
    }),
  };
  const stripe = {
    paymentIntents: {
      create: jest.fn(async () => ({
        id: 'pi_new',
        client_secret: 'pi_new_secret',
        status: 'requires_payment_method',
        amount: 1550,
      })),
      retrieve: jest.fn(),
    },
    refunds: { create: jest.fn(async () => ({ id: 're_1' })) },
  };
  return { db, stripe, deps: { db: db as unknown as Db, stripe: stripe as unknown as StripeApi } };
}

describe('starting a payment', () => {
  it('charges exactly the total the server worked out, in euros, once per order and total', async () => {
    const { db, stripe, deps } = fakes({ order_for_payment: { data: ORDER } });

    await expect(startPayment(deps, 'user-1', ORDER.id)).resolves.toEqual({
      clientSecret: 'pi_new_secret',
      paymentIntentId: 'pi_new',
    });

    expect(db.rpc).toHaveBeenCalledWith('order_for_payment', { p_order_id: ORDER.id, p_user_id: 'user-1' });
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1550,
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
        metadata: { order_id: ORDER.id, user_id: 'user-1' },
      }),
      { idempotencyKey: `order-${ORDER.id}-1550` },
    );
    expect(db.rpc).toHaveBeenCalledWith('attach_payment_intent', { p_order_id: ORDER.id, p_intent_id: 'pi_new' });
  });

  it('picks up the payment already started for the same total', async () => {
    const { stripe, deps } = fakes({ order_for_payment: { data: { ...ORDER, stripe_payment_intent_id: 'pi_old' } } });
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_old',
      client_secret: 'pi_old_secret',
      status: 'requires_payment_method',
      amount: 1550,
    });

    await expect(startPayment(deps, 'user-1', ORDER.id)).resolves.toEqual({
      clientSecret: 'pi_old_secret',
      paymentIntentId: 'pi_old',
    });
    expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it('refuses to charge an order twice', async () => {
    const { stripe, deps } = fakes({ order_for_payment: { data: { ...ORDER, stripe_payment_intent_id: 'pi_old' } } });
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_old',
      client_secret: 's',
      status: 'succeeded',
      amount: 1550,
    });

    await expect(startPayment(deps, 'user-1', ORDER.id)).rejects.toMatchObject({ status: 409 });
    expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("passes on the database's refusal (someone else's order, nothing to pay) and hides other errors", async () => {
    const refused = fakes({ order_for_payment: { error: { message: 'That order can’t be paid', code: 'P0002' } } });
    await expect(startPayment(refused.deps, 'user-2', ORDER.id)).rejects.toEqual(
      new PaymentError('That order can’t be paid', 404),
    );
    expect(refused.stripe.paymentIntents.create).not.toHaveBeenCalled();

    const broken = fakes({ order_for_payment: { error: { message: 'connection reset by peer' } } });
    await expect(startPayment(broken.deps, 'user-1', ORDER.id)).rejects.toMatchObject({
      message: 'Couldn’t start the payment. Try again.',
      status: 500,
    });
  });
});

describe('what Stripe reports', () => {
  const succeeded = {
    type: 'payment_intent.succeeded',
    data: { object: { id: 'pi_1', amount: 1550, amount_received: 1550, metadata: { order_id: ORDER.id } } },
  };

  it('a payment that succeeded pays and places its order, for the amount actually received', async () => {
    const { db, stripe, deps } = fakes({ mark_order_paid: { data: 'placed' } });
    await expect(handleStripeEvent(deps, succeeded)).resolves.toBe('paid');
    expect(db.rpc).toHaveBeenCalledWith('mark_order_paid', {
      p_intent_id: 'pi_1',
      p_order_id: ORDER.id,
      p_amount_cents: 1550,
    });
    expect(stripe.refunds.create).not.toHaveBeenCalled();
  });

  it('a payment for an order that was cancelled, or is gone, is refunded at once', async () => {
    for (const status of ['cancelled', null]) {
      const { db, stripe, deps } = fakes({ mark_order_paid: { data: status } });
      await expect(handleStripeEvent(deps, succeeded)).resolves.toMatch(/^refunded/);
      expect(stripe.refunds.create).toHaveBeenCalledWith({ payment_intent: 'pi_1' }, { idempotencyKey: 'refund-pi_1' });
      expect(db.rpc).toHaveBeenCalledWith('set_refund_status', { p_intent_id: 'pi_1', p_status: 'pending' });
    }
  });

  it('a database error makes the webhook fail, so Stripe sends the event again', async () => {
    const { deps } = fakes({ mark_order_paid: { error: { message: 'The amount paid doesn’t match the order' } } });
    await expect(handleStripeEvent(deps, succeeded)).rejects.toThrow('mark_order_paid');
  });

  it('refunds that went through, or failed, update the order', async () => {
    const refunded = fakes();
    await handleStripeEvent(refunded.deps, {
      type: 'charge.refunded',
      data: { object: { payment_intent: 'pi_1', refunded: true } },
    });
    expect(refunded.db.rpc).toHaveBeenCalledWith('set_refund_status', { p_intent_id: 'pi_1', p_status: 'refunded' });

    const failed = fakes();
    await handleStripeEvent(failed.deps, {
      type: 'refund.failed',
      data: { object: { payment_intent: 'pi_1', status: 'failed' } },
    });
    expect(failed.db.rpc).toHaveBeenCalledWith('set_refund_status', { p_intent_id: 'pi_1', p_status: 'failed' });
  });

  it('ignores everything else, and payments that aren’t for an order', async () => {
    const { db, deps } = fakes();
    await expect(handleStripeEvent(deps, { type: 'customer.created', data: { object: {} } })).resolves.toMatch(
      /^ignored/,
    );
    await expect(
      handleStripeEvent(deps, { type: 'payment_intent.succeeded', data: { object: { id: 'pi_x', amount: 1 } } }),
    ).resolves.toMatch(/^ignored/);
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('refunding a cancelled order', () => {
  const cancelled = { ...ORDER, status: 'cancelled', stripe_payment_intent_id: 'pi_1', refund_status: 'pending' };

  it('asks Stripe to refund the payment, and marks the refund as on its way', async () => {
    const { db, stripe, deps } = fakes({ order_for_refund: { data: cancelled } });
    await refundOrder(deps, 'user-1', ORDER.id);
    expect(db.rpc).toHaveBeenCalledWith('order_for_refund', { p_order_id: ORDER.id, p_user_id: 'user-1' });
    expect(stripe.refunds.create).toHaveBeenCalledWith({ payment_intent: 'pi_1' }, { idempotencyKey: 'refund-pi_1' });
    expect(db.rpc).toHaveBeenCalledWith('set_refund_status', { p_intent_id: 'pi_1', p_status: 'pending' });
  });

  it('marks it failed when Stripe refuses, so staff can send it again', async () => {
    const { db, stripe, deps } = fakes({ order_for_refund: { data: cancelled } });
    stripe.refunds.create.mockRejectedValue(
      Object.assign(new Error('insufficient balance'), { code: 'balance_insufficient' }),
    );
    await expect(refundOrder(deps, 'user-1', ORDER.id)).rejects.toMatchObject({ status: 502 });
    expect(db.rpc).toHaveBeenCalledWith('set_refund_status', { p_intent_id: 'pi_1', p_status: 'failed' });
  });

  it('sends a retry under a new key, and counts "already refunded" as done', async () => {
    const { stripe, deps } = fakes({ order_for_refund: { data: { ...cancelled, refund_status: 'failed' } } });
    stripe.refunds.create.mockRejectedValue(Object.assign(new Error('already'), { code: 'charge_already_refunded' }));
    await expect(refundOrder(deps, 'user-1', ORDER.id)).resolves.toBeUndefined();
    const [, options] = stripe.refunds.create.mock.calls[0] as unknown as [unknown, { idempotencyKey: string }];
    expect(options.idempotencyKey).toMatch(/^refund-pi_1-\d+$/);
  });

  it("refuses an order the caller can't refund", async () => {
    const { stripe, deps } = fakes({
      order_for_refund: { error: { message: 'That order has no refund to make', code: 'P0002' } },
    });
    await expect(refundOrder(deps, 'user-2', ORDER.id)).rejects.toMatchObject({ status: 404 });
    expect(stripe.refunds.create).not.toHaveBeenCalled();
  });
});
