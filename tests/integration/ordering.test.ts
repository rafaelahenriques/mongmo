import { orderPoints } from '@/constants/points';

import { admin, deleteAccount, placeOrder, SEED, signUp, signUpOwner, type Customer } from './helpers';

let customer: Customer;
let owner: Customer;

beforeAll(async () => {
  [customer, owner] = await Promise.all([signUp(), signUpOwner()]);
});
afterAll(async () => {
  await Promise.all([deleteAccount(customer), deleteAccount(owner)]);
});

async function collect(orderId: string) {
  for (const status of ['preparing', 'ready', 'collected'] as const) {
    const { error } = await owner.client.rpc('advance_order_status', { p_order_id: orderId, p_status: status });
    if (error) throw error;
  }
}

async function orderPointsEarned(orderId: string): Promise<number> {
  const { data, error } = await admin
    .from('point_events')
    .select('points')
    .eq('source', 'order')
    .eq('source_id', orderId);
  if (error) throw error;
  return data.reduce((sum, row) => sum + row.points, 0);
}

describe('placing an order', () => {
  it('prices it on the server from the menu, options included, and confirms the payment', async () => {
    const order = await placeOrder(customer, [
      { menu_item_id: SEED.banhMiPork, quantity: 2, options: [SEED.extraProtein] },
      { menu_item_id: SEED.springrollsTofu, quantity: 1, options: [SEED.mangoDip] },
    ]);
    expect(order.status).toBe('paid');
    expect(order.total_cents).toBe((1050 + 100) * 2 + (500 + 0));

    const { data: lines } = await customer.client.from('order_items').select('*').eq('order_id', order.id);
    expect(lines).toHaveLength(2);
  });

  it('refuses an option that goes with another section', async () => {
    await expect(
      placeOrder(customer, [{ menu_item_id: SEED.banhMiPork, quantity: 1, options: [SEED.mangoDip] }]),
    ).rejects.toMatchObject({ message: expect.stringContaining('not available') });
  });

  it('refuses an empty cart and a zero quantity', async () => {
    await expect(placeOrder(customer, [])).rejects.toMatchObject({ message: 'Cart is empty' });
    await expect(placeOrder(customer, [{ menu_item_id: SEED.banhMiPork, quantity: 0 }])).rejects.toMatchObject({
      message: 'Invalid quantity',
    });
  });

  it("won't let a customer move their own order along", async () => {
    const order = await placeOrder(customer, [{ menu_item_id: SEED.banhMiPork, quantity: 1 }]);
    const { error } = await customer.client.rpc('advance_order_status', {
      p_order_id: order.id,
      p_status: 'collected',
    });
    expect(error?.message).toBe('Only an owner can update order status');
  });
});

describe('points for orders', () => {
  it('doubles the first collected order, then pays the level rate, exactly as the app says', async () => {
    const fresh = await signUp();
    try {
      const first = await placeOrder(fresh, [{ menu_item_id: SEED.banhMiPork, quantity: 1 }]);
      await collect(first.id);
      expect(await orderPointsEarned(first.id)).toBe(orderPoints(first.total_cents, { firstOrder: true }));
      expect(await orderPointsEarned(first.id)).toBe(210);

      const second = await placeOrder(fresh, [{ menu_item_id: SEED.banhMiPork, quantity: 3 }]);
      await collect(second.id);
      expect(await orderPointsEarned(second.id)).toBe(orderPoints(second.total_cents, { bonusPct: 0 }));
    } finally {
      await deleteAccount(fresh);
    }
  });

  it('adds the Rising bonus once lifetime points reach 500', async () => {
    const regular = await signUp();
    try {
      const first = await placeOrder(regular, [{ menu_item_id: SEED.banhMiPork, quantity: 3 }]);
      await collect(first.id);
      // 3,150 cents doubled is 630 lifetime points: Rising, +10%.
      const second = await placeOrder(regular, [{ menu_item_id: SEED.banhMiPork, quantity: 2 }]);
      await collect(second.id);
      expect(await orderPointsEarned(second.id)).toBe(orderPoints(2100, { bonusPct: 10 }));
      expect(await orderPointsEarned(second.id)).toBe(231);

      // Lifetime points: every point earned (orders, and any badge the orders unlocked).
      const { data: earned } = await admin
        .from('point_events')
        .select('points')
        .eq('user_id', regular.userId)
        .gt('points', 0);
      const { data: loyalty } = await regular.client.rpc('my_loyalty');
      expect(loyalty?.[0]).toEqual({
        lifetime_points: earned!.reduce((sum, row) => sum + row.points, 0),
        first_order_bonus: false,
      });
      expect(loyalty?.[0]?.lifetime_points).toBeGreaterThanOrEqual(630 + 231);
    } finally {
      await deleteAccount(regular);
    }
  });

  it('awards an order only once, even if it is marked collected again', async () => {
    const order = await placeOrder(customer, [{ menu_item_id: SEED.springrollsTofu, quantity: 1 }]);
    await collect(order.id);
    const before = await orderPointsEarned(order.id);
    await owner.client.rpc('advance_order_status', { p_order_id: order.id, p_status: 'collected' });
    expect(await orderPointsEarned(order.id)).toBe(before);
  });
});
