import { orderPoints } from '@/constants/points';

import { admin, deleteAccount, givePoints, placeOrder, SEED, signUp, signUpOwner, type Customer } from './helpers';

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
  it('prices it on the server from the menu, options included, and places it to pay at pickup', async () => {
    const order = await placeOrder(customer, [
      { menu_item_id: SEED.banhMiPork, quantity: 2, options: [SEED.noCoriander, SEED.spicy] },
      {
        menu_item_id: SEED.springrollsTofu,
        quantity: 1,
        options: [SEED.mangoSauce, SEED.coriander, SEED.notSpicy, SEED.extraPeanutSauce],
      },
    ]);
    expect(order.status).toBe('placed');
    expect(order).toMatchObject({ payment: 'at_pickup', paid_at: null, note: null });
    // Coriander, spice and the sauce that comes with it are free; more sauce is €0.90.
    expect(order.total_cents).toBe(1050 * 2 + (500 + 90));

    // The kitchen sees every choice spelled out, the default ones too.
    const { data: lines } = await customer.client.from('order_items').select('*').eq('order_id', order.id);
    expect(lines).toHaveLength(2);
    expect(lines!.map((line) => line.options_snapshot).sort()).toEqual([
      'Mango sauce, With coriander, Not spicy, Extra peanut sauce',
      'No coriander, Spicy',
    ]);
  });

  it('refuses an option that goes with another section', async () => {
    for (const option of [SEED.mangoSauce, SEED.extraPeanutSauce]) {
      await expect(
        placeOrder(customer, [{ menu_item_id: SEED.banhMiPork, quantity: 1, options: [option] }]),
      ).rejects.toMatchObject({ message: expect.stringContaining('not available') });
    }
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

  it('is paid when staff hand it over, not before', async () => {
    const order = await placeOrder(customer, [{ menu_item_id: SEED.banhMiPork, quantity: 1 }]);
    const step = async (status: 'preparing' | 'ready' | 'collected') =>
      (await owner.client.rpc('advance_order_status', { p_order_id: order.id, p_status: status })).data;
    expect((await step('ready'))?.paid_at).toBeNull();
    const collected = await step('collected');
    expect(collected?.status).toBe('collected');
    expect(collected?.paid_at).not.toBeNull();
  });
});

describe('cancelling an order', () => {
  const cancel = (who: Customer, orderId: string) =>
    who.client.rpc('cancel_my_order' as never, { p_order_id: orderId } as never);
  const rewardUsedAt = async (id: string) =>
    (await admin.from('user_rewards').select('used_at').eq('id', id).single()).data?.used_at ?? null;

  it('lets the customer cancel until the café starts, and gives a used reward back', async () => {
    await givePoints(customer.userId, 400);
    const { data: redeemed, error } = await customer.client.rpc('redeem_reward', {
      p_reward_id: SEED.discountReward,
    });
    expect(error).toBeNull();
    const rewardId = (redeemed as { id: string }).id;
    const order = await placeOrder(customer, [{ menu_item_id: SEED.banhMiPork, quantity: 1 }], rewardId);
    expect(await rewardUsedAt(rewardId)).not.toBeNull();

    const { data: cancelled, error: cancelError } = await cancel(customer, order.id);
    expect(cancelError).toBeNull();
    expect((cancelled as unknown as { status: string }).status).toBe('cancelled');
    expect(await rewardUsedAt(rewardId)).toBeNull();
  });

  it("won't cancel once staff have accepted it, or someone else's", async () => {
    const order = await placeOrder(customer, [{ menu_item_id: SEED.banhMiPork, quantity: 1 }]);
    expect((await cancel(owner, order.id)).error).not.toBeNull();
    await owner.client.rpc('advance_order_status', { p_order_id: order.id, p_status: 'preparing' });
    expect((await cancel(customer, order.id)).error?.message).toMatch(/started on it/);
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

describe('a note with an order', () => {
  const draft = async (person: Customer) => {
    const { data, error } = await person.client.rpc('create_order', {
      p_store_id: SEED.storeId,
      p_event_id: null,
      p_items: [{ menu_item_id: SEED.banhMiPork, quantity: 1 }],
      p_pickup_at: null,
      p_user_reward_id: null,
    });
    if (error) throw error;
    return data;
  };
  const setNote = (person: Customer, orderId: string, note: string | null) =>
    person.client.rpc('set_order_note', { p_order_id: orderId, p_note: note });

  it('is kept on one line with the order, and staff read it on their board', async () => {
    const order = await draft(customer);
    const { data, error } = await setNote(customer, order.id, '  No coriander,\n please  ');
    expect(error).toBeNull();
    expect(data!.note).toBe('No coriander, please');

    await customer.client.rpc('place_order', { p_order_id: order.id });
    const { data: board } = await owner.client.rpc('owner_board_orders', { p_since: new Date().toISOString() });
    expect(board!.find((row) => row.id === order.id)?.note).toBe('No coriander, please');
  });

  it('can be cleared, and takes at most 200 characters', async () => {
    const order = await draft(customer);
    expect((await setNote(customer, order.id, 'x'.repeat(200))).data!.note).toHaveLength(200);
    expect((await setNote(customer, order.id, 'x'.repeat(201))).error?.code).toBe('22023');
    expect((await setNote(customer, order.id, '   ')).data!.note).toBeNull();
  });

  it("can't be changed once the order is placed, or on someone else's order", async () => {
    const order = await draft(customer);
    expect((await setNote(owner, order.id, 'free food please')).error?.code).toBe('P0002');
    await customer.client.rpc('place_order', { p_order_id: order.id });
    expect((await setNote(customer, order.id, 'changed my mind')).error?.code).toBe('P0002');
    // Nor by writing to the table directly.
    await customer.client.from('orders').update({ note: 'sneaky' }).eq('id', order.id);
    const { data: after } = await customer.client.from('orders').select('note').eq('id', order.id).single();
    expect(after!.note).toBeNull();
  });
});

describe('order badges', () => {
  const badges = async (person: Customer) => {
    const { data, error } = await admin.from('user_badges').select('badges(key)').eq('user_id', person.userId);
    if (error) throw error;
    return data.map((row) => (row.badges as unknown as { key: string }).key);
  };

  it('come from orders that were picked up: a cancelled order earns no badge and no points', async () => {
    const fresh = await signUp();
    try {
      const cancelled = await placeOrder(fresh, [{ menu_item_id: SEED.banhMiPork, quantity: 1 }]);
      await fresh.client.rpc('cancel_my_order', { p_order_id: cancelled.id });
      expect(await badges(fresh)).not.toContain('first-order');
      const { data: balance } = await fresh.client.rpc('my_points_balance');
      expect(balance).toBe(0);

      const collected = await placeOrder(fresh, [{ menu_item_id: SEED.banhMiPork, quantity: 1 }]);
      expect(await badges(fresh)).not.toContain('first-order');
      await collect(collected.id);
      expect(await badges(fresh)).toContain('first-order');
    } finally {
      await deleteAccount(fresh);
    }
  });
});

describe('the leaderboard', () => {
  it('lists people who have points, not everyone who joined it', async () => {
    const [withPoints, without] = await Promise.all([signUp(), signUp()]);
    try {
      for (const person of [withPoints, without]) {
        await person.client.from('profiles').update({ leaderboard_visible: true }).eq('id', person.userId);
      }
      await givePoints(withPoints.userId, 30);
      const { data, error } = await customer.client.rpc('leaderboard', { p_period: 'all' });
      expect(error).toBeNull();
      const ids = data!.map((row) => row.user_id);
      expect(ids).toContain(withPoints.userId);
      expect(ids).not.toContain(without.userId);
    } finally {
      await Promise.all([deleteAccount(withPoints), deleteAccount(without)]);
    }
  });
});
