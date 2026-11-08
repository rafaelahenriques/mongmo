import { anonClient, deleteAccount, placeOrder, SEED, signUp, type Customer } from './helpers';

let alice: Customer;
let bob: Customer;

beforeAll(async () => {
  [alice, bob] = await Promise.all([signUp(), signUp()]);
  await placeOrder(alice, [{ menu_item_id: SEED.banhMiPork, quantity: 2 }]);
  await placeOrder(bob, [{ menu_item_id: SEED.springrollsTofu, quantity: 1 }]);
});
afterAll(async () => {
  await Promise.all([deleteAccount(alice), deleteAccount(bob)]);
});

type Export = {
  account: { id: string; email: string };
  orders: { user_id: string; items: { quantity: number }[] }[];
  points: unknown[];
};

it('gives a person all of their own data, and nobody else’s', async () => {
  const { data, error } = await alice.client.rpc('export_my_data');
  expect(error).toBeNull();
  const exported = data as unknown as Export;
  expect(exported.account).toMatchObject({ id: alice.userId, email: alice.email });
  expect(exported.orders).toHaveLength(1);
  expect(exported.orders[0]).toMatchObject({ user_id: alice.userId, items: [{ quantity: 2 }] });
  expect(JSON.stringify(exported)).not.toContain(bob.userId);
  expect(JSON.stringify(exported)).not.toContain(bob.email);
});

it('needs a signed-in user', async () => {
  const { error } = await anonClient().rpc('export_my_data');
  expect(error).not.toBeNull();
});
