import { deleteAccount, givePoints, placeOrder, SEED, signUp, type Customer } from './helpers';

let customer: Customer;

beforeAll(async () => {
  customer = await signUp();
});
afterAll(async () => {
  await deleteAccount(customer);
});

const balance = async () => (await customer.client.rpc('my_points_balance')).data;
const lifetime = async () => (await customer.client.rpc('my_loyalty')).data?.[0]?.lifetime_points;

it('refuses a reward without enough points', async () => {
  const { error } = await customer.client.rpc('redeem_reward', { p_reward_id: SEED.toteReward });
  expect(error?.message).toMatch(/Reach Rising|Not enough points/);
});

it('keeps level rewards for that level, then spends the points without lowering the level', async () => {
  await givePoints(customer.userId, 450);
  const locked = await customer.client.rpc('redeem_reward', { p_reward_id: SEED.toteReward });
  expect(locked.error?.message).toBe('Reach Rising to unlock this reward');

  await givePoints(customer.userId, 100);
  const redeemed = await customer.client.rpc('redeem_reward', { p_reward_id: SEED.toteReward });
  expect(redeemed.error).toBeNull();
  expect(await balance()).toBe(550 - 400);
  expect(await lifetime()).toBe(550);

  const golden = await customer.client.rpc('redeem_reward', { p_reward_id: SEED.stewReward });
  expect(golden.error?.message).toBe('Reach Golden to unlock this reward');
});

it("won't take another customer's reward on an order", async () => {
  const other = await signUp();
  try {
    const { data: rewards } = await customer.client.from('user_rewards').select('id').eq('user_id', customer.userId);
    const rewardId = rewards![0]!.id;
    await expect(placeOrder(other, [{ menu_item_id: SEED.banhMiPork, quantity: 1 }], rewardId)).rejects.toMatchObject({
      message: 'That reward is not available to use',
    });
  } finally {
    await deleteAccount(other);
  }
});
