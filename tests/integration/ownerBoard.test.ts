import { admin, deleteAccount, SEED, signUp, signUpOwner, type Customer } from './helpers';

/**
 * The owner's board (0037) gets what the kitchen still has, what finished
 * in the last day, and refunds still owed; not the whole order history.
 * The orders policies still decide who sees what.
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

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString();

async function placed(): Promise<string> {
  const { data, error } = await customer.client.rpc('create_order', {
    p_store_id: SEED.storeId,
    p_event_id: null,
    p_items: [{ menu_item_id: SEED.banhMiPork, quantity: 1 }],
    p_pickup_at: null,
    p_user_reward_id: null,
  });
  if (error) throw error;
  const id = (data as unknown as { id: string }).id;
  const place = await customer.client.rpc('place_order', { p_order_id: id });
  if (place.error) throw place.error;
  return id;
}

async function set(id: string, values: Record<string, unknown>) {
  const { error } = await admin
    .from('orders')
    .update(values as never)
    .eq('id', id);
  if (error) throw error;
}

it('lists open orders, the last day’s finished ones and refunds owed, for the owner only', async () => {
  const [stillOpen, collectedToday, collectedLastWeek, refundOwed, cancelledLastWeek] = await Promise.all([
    placed(),
    placed(),
    placed(),
    placed(),
    placed(),
  ]);
  await Promise.all([
    set(stillOpen, { created_at: daysAgo(3) }),
    set(collectedToday, { status: 'collected', created_at: daysAgo(0.5) }),
    set(collectedLastWeek, { status: 'collected', created_at: daysAgo(7) }),
    set(refundOwed, {
      status: 'cancelled',
      payment: 'online',
      paid_at: daysAgo(5),
      refund_status: 'pending',
      created_at: daysAgo(5),
    }),
    set(cancelledLastWeek, { status: 'cancelled', created_at: daysAgo(7) }),
  ]);

  const board = await staff.client.rpc('owner_board_orders', { p_since: daysAgo(1) });
  expect(board.error).toBeNull();
  const ids = (board.data ?? []).map((order) => order.id);
  expect(ids).toEqual(expect.arrayContaining([stillOpen, collectedToday, refundOwed]));
  expect(ids).not.toContain(collectedLastWeek);
  expect(ids).not.toContain(cancelledLastWeek);

  // Anyone else only ever sees their own orders through it.
  const theirs = await other.client.rpc('owner_board_orders', { p_since: daysAgo(1) });
  expect(theirs.error).toBeNull();
  expect(theirs.data).toEqual([]);
});
