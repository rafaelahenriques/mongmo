import { admin, anonClient, givePoints, placeOrder, SEED, signUp } from './helpers';

/** How many rows of each kind still belong to this user, read past every security rule. */
async function leftovers(userId: string, orderIds: string[]) {
  const count = async (query: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count: rows, error } = await query;
    if (error) throw error;
    return rows;
  };
  return {
    profiles: await count(admin.from('profiles').select('id', { count: 'exact', head: true }).eq('id', userId)),
    orders: await count(admin.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
    orderItems: await count(
      admin.from('order_items').select('id', { count: 'exact', head: true }).in('order_id', orderIds),
    ),
    pointEvents: await count(
      admin.from('point_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ),
    userRewards: await count(
      admin.from('user_rewards').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ),
  };
}

it('deletes the login and every row that belongs to the account, not just a flag', async () => {
  const customer = await signUp();
  const order = await placeOrder(customer, [{ menu_item_id: SEED.banhMiPork, quantity: 2 }]);
  await givePoints(customer.userId, 600);
  const { error: redeemError } = await customer.client.rpc('redeem_reward', { p_reward_id: SEED.toteReward });
  expect(redeemError).toBeNull();

  // Points from the grant and the redemption, and any badge the order unlocked.
  const before = await leftovers(customer.userId, [order.id]);
  expect(before).toEqual({
    profiles: 1,
    orders: 1,
    orderItems: 1,
    pointEvents: expect.any(Number),
    userRewards: 1,
  });
  expect(before.pointEvents).toBeGreaterThanOrEqual(2);

  const { error } = await customer.client.rpc('delete_my_account');
  expect(error).toBeNull();

  expect(await leftovers(customer.userId, [order.id])).toEqual({
    profiles: 0,
    orders: 0,
    orderItems: 0,
    pointEvents: 0,
    userRewards: 0,
  });
  const { data: login } = await admin.auth.admin.getUserById(customer.userId);
  expect(login.user).toBeNull();
});

it('needs a signed-in user', async () => {
  const { error } = await anonClient().rpc('delete_my_account');
  expect(error).not.toBeNull();
});
