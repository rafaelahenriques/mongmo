import { admin, deleteAccount, placeOrder, SEED, signUp, signUpOwner, type Customer } from './helpers';

/** A date this many months before now. */
const monthsAgo = (months: number) => new Date(Date.now() - months * 30.5 * 24 * 60 * 60 * 1000).toISOString();

let customer: Customer;

beforeAll(async () => {
  customer = await signUp();
});
afterAll(async () => {
  await deleteAccount(customer);
});

const exists = async (table: 'orders' | 'check_ins', column: string, value: string) =>
  ((await admin.from(table).select(column).eq(column, value)).data ?? []).length > 0;

it('deletes old orders, stale drafts and old check-ins, and keeps recent ones', async () => {
  const old = await placeOrder(customer, [{ menu_item_id: SEED.banhMiPork, quantity: 1 }]);
  const recent = await placeOrder(customer, [{ menu_item_id: SEED.banhMiPork, quantity: 1 }]);
  const { data: draft } = await customer.client.rpc('create_order', {
    p_store_id: SEED.storeId,
    p_event_id: null,
    p_items: [{ menu_item_id: SEED.banhMiPork, quantity: 1 }],
    p_pickup_at: null,
    p_user_reward_id: null,
  });
  await admin
    .from('orders')
    .update({ created_at: monthsAgo(25) })
    .eq('id', old.id);
  await admin
    .from('orders')
    .update({ created_at: monthsAgo(0.1) })
    .eq('id', draft!.id);
  const { data: event } = await admin.from('events').select('id').limit(1).single();
  await admin.from('check_ins').insert({ user_id: customer.userId, event_id: event!.id, checked_in_at: monthsAgo(25) });

  const { data: deleted, error } = await admin.rpc('apply_retention' as never);
  expect(error).toBeNull();
  expect(deleted).toMatchObject({ orders: expect.any(Number), draft_orders: expect.any(Number) });

  expect(await exists('orders', 'id', old.id)).toBe(false);
  expect(await exists('orders', 'id', draft!.id)).toBe(false);
  expect(await exists('orders', 'id', recent.id)).toBe(true);
  expect(await exists('check_ins', 'user_id', customer.userId)).toBe(false);
});

it('marks an account for deletion only after 24 months without use', async () => {
  const expiredAt = async (when: Date) =>
    ((await admin.rpc('retention_expired_accounts' as never, { p_now: when.toISOString() } as never)).data as
      string[] | null) ?? [];
  expect(await expiredAt(new Date())).not.toContain(customer.userId);
  expect(await expiredAt(new Date(Date.now() + 25 * 31 * 24 * 60 * 60 * 1000))).toContain(customer.userId);
});

it('never marks a staff account for deletion', async () => {
  const owner = await signUpOwner();
  try {
    const later = new Date(Date.now() + 25 * 31 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await admin.rpc('retention_expired_accounts' as never, { p_now: later } as never);
    expect((data as string[] | null) ?? []).not.toContain(owner.userId);
  } finally {
    await deleteAccount(owner);
  }
});

it('cannot be run from the app', async () => {
  const { error } = await customer.client.rpc('apply_retention' as never);
  expect(error).not.toBeNull();
});
