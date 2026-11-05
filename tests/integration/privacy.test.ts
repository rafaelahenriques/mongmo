import { anonClient, deleteAccount, placeOrder, SEED, signUp, type Customer } from './helpers';

let alice: Customer;
let bob: Customer;
let aliceOrderId: string;

beforeAll(async () => {
  [alice, bob] = await Promise.all([signUp(), signUp()]);
  aliceOrderId = (await placeOrder(alice, [{ menu_item_id: SEED.banhMiPork, quantity: 1 }])).id;
});
afterAll(async () => {
  await Promise.all([deleteAccount(alice), deleteAccount(bob)]);
});

it("hides one customer's orders and order lines from another", async () => {
  const orders = await bob.client.from('orders').select('id').eq('id', aliceOrderId);
  const lines = await bob.client.from('order_items').select('id').eq('order_id', aliceOrderId);
  expect(orders.data).toEqual([]);
  expect(lines.data).toEqual([]);
});

it("hides one customer's points from another", async () => {
  const points = await bob.client.from('point_events').select('id').eq('user_id', alice.userId);
  expect(points.data).toEqual([]);
});

it('shows a signed-out visitor no orders at all', async () => {
  const { data } = await anonClient().from('orders').select('id');
  expect(data ?? []).toEqual([]);
});

it("won't let the app read anyone's lifetime points directly", async () => {
  const { error } = await alice.client.rpc('lifetime_points' as never, { p_user: bob.userId } as never);
  expect(error).not.toBeNull();
});

it("won't let a customer make themselves an owner", async () => {
  await alice.client.from('profiles').update({ role: 'owner' }).eq('id', alice.userId);
  const { data } = await alice.client.from('profiles').select('role').eq('id', alice.userId).single();
  expect(data?.role).toBe('customer');
});
