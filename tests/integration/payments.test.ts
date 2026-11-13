import { admin, deleteAccount, SEED, signUp, signUpOwner, type Client, type Customer } from './helpers';

/**
 * Paying online (0036): only the Edge Functions (the service role) can
 * start a payment or mark an order paid; the amount must be the order's;
 * cancelling a paid order marks it for a refund. No Stripe here: these are
 * the database rules the functions rely on.
 */
let customer: Customer;
let other: Customer;
let staff: Customer;

beforeAll(async () => {
  [customer, other, staff] = await Promise.all([signUp(), signUp(), signUpOwner()]);
});
afterAll(async () => {
  await Promise.all([deleteAccount(customer), deleteAccount(other), deleteAccount(staff)]);
});

type Order = {
  id: string;
  status: string;
  payment: string;
  paid_at: string | null;
  total_cents: number;
  refund_status: string | null;
};

const rpc = (client: Client, fn: string, args: Record<string, unknown>) =>
  client.rpc(fn as never, args as never) as unknown as Promise<{ data: unknown; error: { message: string } | null }>;

async function draft(): Promise<Order> {
  const { data, error } = await customer.client.rpc('create_order', {
    p_store_id: SEED.storeId,
    p_event_id: null,
    p_items: [{ menu_item_id: SEED.banhMiPork, quantity: 1 }],
    p_pickup_at: null,
    p_user_reward_id: null,
  });
  if (error) throw error;
  return data as unknown as Order;
}

async function read(orderId: string): Promise<Order> {
  const { data } = await admin.from('orders').select('*').eq('id', orderId).single();
  return data as unknown as Order;
}

/** A draft paid online, the way the Edge Functions do it. */
async function paidOnline(): Promise<Order> {
  const order = await draft();
  const intent = `pi_test_${order.id.slice(0, 8)}`;
  expect((await rpc(admin, 'attach_payment_intent', { p_order_id: order.id, p_intent_id: intent })).error).toBeNull();
  const paid = await rpc(admin, 'mark_order_paid', {
    p_intent_id: intent,
    p_order_id: order.id,
    p_amount_cents: order.total_cents,
  });
  expect(paid).toMatchObject({ data: 'placed', error: null });
  return read(order.id);
}

it('lets only the Edge Functions start payments and mark orders paid', async () => {
  const order = await draft();
  for (const [fn, args] of [
    ['order_for_payment', { p_order_id: order.id, p_user_id: customer.userId }],
    ['attach_payment_intent', { p_order_id: order.id, p_intent_id: 'pi_fake' }],
    ['mark_order_paid', { p_intent_id: 'pi_fake', p_order_id: order.id, p_amount_cents: order.total_cents }],
    ['set_refund_status', { p_intent_id: 'pi_fake', p_status: 'refunded' }],
    ['order_for_refund', { p_order_id: order.id, p_user_id: customer.userId }],
  ] as const) {
    expect((await rpc(customer.client, fn, args)).error).not.toBeNull();
  }
  // Nor by writing to the order directly.
  await customer.client
    .from('orders')
    .update({ paid_at: new Date().toISOString() } as never)
    .eq('id', order.id);
  expect((await read(order.id)).paid_at).toBeNull();
});

it("only starts a payment for the customer's own draft", async () => {
  const order = await draft();
  expect(
    (await rpc(admin, 'order_for_payment', { p_order_id: order.id, p_user_id: customer.userId })).error,
  ).toBeNull();
  expect(
    (await rpc(admin, 'order_for_payment', { p_order_id: order.id, p_user_id: other.userId })).error,
  ).not.toBeNull();
});

it('marks an order paid only for its own payment and exact amount, once', async () => {
  const order = await draft();
  await rpc(admin, 'attach_payment_intent', { p_order_id: order.id, p_intent_id: 'pi_test_exact' });

  const tooLittle = await rpc(admin, 'mark_order_paid', {
    p_intent_id: 'pi_test_exact',
    p_order_id: order.id,
    p_amount_cents: order.total_cents - 1,
  });
  expect(tooLittle.error).not.toBeNull();
  const wrongPayment = await rpc(admin, 'mark_order_paid', {
    p_intent_id: 'pi_test_other',
    p_order_id: order.id,
    p_amount_cents: order.total_cents,
  });
  expect(wrongPayment.error).not.toBeNull();
  expect((await read(order.id)).paid_at).toBeNull();

  const args = { p_intent_id: 'pi_test_exact', p_order_id: order.id, p_amount_cents: order.total_cents };
  expect((await rpc(admin, 'mark_order_paid', args)).data).toBe('placed');
  const paid = await read(order.id);
  expect(paid).toMatchObject({ status: 'placed', payment: 'online' });
  expect(paid.paid_at).not.toBeNull();
  // Stripe may send the same event again: nothing changes.
  expect((await rpc(admin, 'mark_order_paid', args)).data).toBe('placed');
  expect((await read(order.id)).paid_at).toBe(paid.paid_at);
});

it('says when the order is gone, so the payment can be refunded', async () => {
  expect(
    (
      await rpc(admin, 'mark_order_paid', {
        p_intent_id: 'pi_test_gone',
        p_order_id: '00000000-0000-0000-0000-00000000dead',
        p_amount_cents: 100,
      })
    ).data,
  ).toBeNull();
});

it('keeps an order paid online when the customer chose pay at pickup meanwhile', async () => {
  const order = await draft();
  await rpc(admin, 'attach_payment_intent', { p_order_id: order.id, p_intent_id: 'pi_test_switch' });
  const { error } = await customer.client.rpc('place_order', { p_order_id: order.id });
  expect(error).toBeNull();
  expect((await read(order.id)).payment).toBe('at_pickup');

  await rpc(admin, 'mark_order_paid', {
    p_intent_id: 'pi_test_switch',
    p_order_id: order.id,
    p_amount_cents: order.total_cents,
  });
  const after = await read(order.id);
  expect(after).toMatchObject({ status: 'placed', payment: 'online' });
  expect(after.paid_at).not.toBeNull();
});

it('marks a paid order for a refund when the customer cancels it, for them or staff to send', async () => {
  const order = await paidOnline();
  const { data, error } = await customer.client.rpc('cancel_my_order', { p_order_id: order.id });
  expect(error).toBeNull();
  expect(data).toMatchObject({ status: 'cancelled', refund_status: 'pending' });

  expect((await rpc(admin, 'order_for_refund', { p_order_id: order.id, p_user_id: customer.userId })).error).toBeNull();
  expect((await rpc(admin, 'order_for_refund', { p_order_id: order.id, p_user_id: staff.userId })).error).toBeNull();
  expect(
    (await rpc(admin, 'order_for_refund', { p_order_id: order.id, p_user_id: other.userId })).error,
  ).not.toBeNull();
});

it('marks a paid order for a refund when staff cancel it, and a refund stays refunded', async () => {
  const order = await paidOnline();
  const { data, error } = await staff.client.rpc('advance_order_status', {
    p_order_id: order.id,
    p_status: 'cancelled',
  });
  expect(error).toBeNull();
  expect(data).toMatchObject({ refund_status: 'pending' });

  const intent = `pi_test_${order.id.slice(0, 8)}`;
  await rpc(admin, 'set_refund_status', { p_intent_id: intent, p_status: 'refunded' });
  await rpc(admin, 'set_refund_status', { p_intent_id: intent, p_status: 'pending' });
  const after = await read(order.id);
  expect(after.refund_status).toBe('refunded');
  // Nothing more to refund.
  expect(
    (await rpc(admin, 'order_for_refund', { p_order_id: order.id, p_user_id: customer.userId })).error,
  ).not.toBeNull();
});

it('leaves orders paid at the counter without a refund', async () => {
  const order = await draft();
  await customer.client.rpc('place_order', { p_order_id: order.id });
  const { data } = await customer.client.rpc('cancel_my_order', { p_order_id: order.id });
  expect(data).toMatchObject({ status: 'cancelled', refund_status: null });
});
