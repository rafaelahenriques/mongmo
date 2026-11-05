import { admin, anonClient, deleteAccount, placeOrder, SEED, signUp, type Client, type Customer } from './helpers';

/**
 * Server-side authorization: the database decides, whatever the app
 * sends. Alice and Bob are two customers; every test tries to read or
 * change one's data as the other (or as nobody) and checks the database
 * refuses.
 */
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

/** Rows a query really changed, read back past every rule. */
async function orderStatus(id: string) {
  return (await admin.from('orders').select('status, total_cents').eq('id', id).single()).data;
}

describe('a visitor who is not signed in', () => {
  const visitor = anonClient();
  const calls: [string, Record<string, unknown>][] = [
    ['leaderboard', { p_period: 'all' }],
    ['create_order', { p_store_id: SEED.storeId, p_event_id: null, p_items: [], p_pickup_at: null }],
    ['confirm_mock_payment', { p_order_id: '00000000-0000-0000-0000-000000000000' }],
    ['redeem_reward', { p_reward_id: SEED.toteReward }],
    ['my_stats', {}],
    ['my_points_balance', {}],
    ['my_loyalty', {}],
    ['my_badge_progress', {}],
    ['ensure_profile', {}],
    ['delete_my_account', {}],
    ['get_event_qr_token', { p_event_id: '00000000-0000-0000-0000-000000000000' }],
    ['advance_order_status', { p_order_id: aliceOrderId, p_status: 'collected' }],
    ['is_owner', {}],
  ];

  it.each(calls)('cannot call %s', async (name, args) => {
    const { error } = await visitor.rpc(name as never, args as never);
    expect(error).not.toBeNull();
  });

  it('reads no orders, profiles, points or check-ins', async () => {
    for (const table of ['orders', 'order_items', 'profiles', 'point_events', 'check_ins', 'user_rewards'] as const) {
      const { data } = await visitor.from(table).select('*').limit(1);
      expect(data ?? []).toEqual([]);
    }
  });
});

describe("one customer and another's data", () => {
  it("can't read Alice's orders, lines, points, check-ins or rewards", async () => {
    expect((await bob.client.from('orders').select('id').eq('id', aliceOrderId)).data).toEqual([]);
    expect((await bob.client.from('order_items').select('id').eq('order_id', aliceOrderId)).data).toEqual([]);
    expect((await bob.client.from('point_events').select('id').eq('user_id', alice.userId)).data).toEqual([]);
    expect((await bob.client.from('check_ins').select('user_id').eq('user_id', alice.userId)).data).toEqual([]);
    expect((await bob.client.from('user_rewards').select('id').eq('user_id', alice.userId)).data).toEqual([]);
  });

  it("can't read Alice's profile, or change it", async () => {
    expect((await bob.client.from('profiles').select('id').eq('id', alice.userId)).data).toEqual([]);
    await bob.client.from('profiles').update({ name: 'Hacked' }).eq('id', alice.userId);
    const { data } = await admin.from('profiles').select('name').eq('id', alice.userId).single();
    expect(data?.name).not.toBe('Hacked');
  });

  it("can't change, cancel, pay for or delete Alice's order", async () => {
    const before = await orderStatus(aliceOrderId);
    await bob.client.from('orders').update({ status: 'cancelled' }).eq('id', aliceOrderId);
    await bob.client.from('orders').delete().eq('id', aliceOrderId);
    const pay = await bob.client.rpc('confirm_mock_payment', { p_order_id: aliceOrderId });
    expect(pay.error).not.toBeNull();
    expect(await orderStatus(aliceOrderId)).toEqual(before);
  });

  it("can't put a photo record in Alice's folder", async () => {
    const { error } = await bob.client.from('photos').insert({
      user_id: alice.userId,
      event_id: '00000000-0000-0000-0000-0000000000e3',
      challenge_id: null,
      storage_path: `${alice.userId}/planted.jpg`,
    });
    expect(error).not.toBeNull();
  });
});

describe('what only the server may write', () => {
  /** Tries a direct write and checks the security rules refused it (not a typo in the test). */
  async function refused(client: Client, table: string, row: Record<string, unknown>) {
    const { error } = await client.from(table as never).insert(row as never);
    expect(error?.code).toBe('42501');
  }

  it("won't let a customer give themselves points, badges, rewards or a check-in", async () => {
    await refused(alice.client, 'point_events', { user_id: alice.userId, points: 10000, source: 'badge' });
    await refused(alice.client, 'user_rewards', { user_id: alice.userId, reward_id: SEED.toteReward });
    await refused(alice.client, 'user_badges', {
      user_id: alice.userId,
      badge_id: '00000000-0000-0000-0000-000000000000',
    });
    await refused(alice.client, 'check_ins', {
      user_id: alice.userId,
      event_id: '00000000-0000-0000-0000-0000000000e3',
    });
    const { data } = await admin.from('point_events').select('points').eq('user_id', alice.userId).gt('points', 1000);
    expect(data).toEqual([]);
  });

  it('won’t let a customer write an order with their own price', async () => {
    await refused(alice.client, 'orders', { user_id: alice.userId, store_id: SEED.storeId, total_cents: 1 });
    await refused(alice.client, 'order_items', {
      order_id: aliceOrderId,
      menu_item_id: SEED.banhMiPork,
      name_snapshot: 'Bánh mì',
      unit_price_cents_snapshot: 0,
      quantity: 10,
      line_total_cents: 0,
    });
  });

  it('won’t let a customer change the menu, the café or the rewards', async () => {
    await alice.client.from('menu_items').update({ price_cents: 1 }).eq('id', SEED.banhMiPork);
    await alice.client.from('rewards').update({ cost_points: 1 }).eq('id', SEED.toteReward);
    await alice.client.from('stores').update({ name: 'Hacked' }).eq('id', SEED.storeId);
    expect(
      (await admin.from('menu_items').select('price_cents').eq('id', SEED.banhMiPork).single()).data?.price_cents,
    ).toBe(1050);
    expect(
      (await admin.from('rewards').select('cost_points').eq('id', SEED.toteReward).single()).data?.cost_points,
    ).toBe(400);
    expect((await admin.from('stores').select('name').eq('id', SEED.storeId).single()).data?.name).not.toBe('Hacked');
  });

  it('won’t give a customer a pop-up’s check-in code', async () => {
    const { data: event } = await admin.from('events').select('id').limit(1).single();
    const { error } = await alice.client.rpc('get_event_qr_token', { p_event_id: event!.id });
    expect(error).not.toBeNull();
  });
});

describe('input limits the database enforces', () => {
  it('refuses a profile picture link that isn’t https', async () => {
    const { error } = await alice.client
      .from('profiles')
      .update({ avatar_url: 'http://tracker.example/pixel.gif' })
      .eq('id', alice.userId);
    expect(error?.code).toBe('23514');
  });

  it('refuses a name that is too long', async () => {
    const { error } = await alice.client
      .from('profiles')
      .update({ name: 'x'.repeat(200) })
      .eq('id', alice.userId);
    expect(error?.code).toBe('23514');
  });
});

// Photo files live in Supabase Storage. CI runs it; a local stack without
// it can skip these with SKIP_STORAGE_TESTS=1.
const storage = process.env.SKIP_STORAGE_TESTS === '1' ? describe.skip : describe;

storage('challenge photos in storage', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

  it("can't be uploaded into someone else's folder", async () => {
    const { error } = await bob.client.storage
      .from('challenge-photos')
      .upload(`${alice.userId}/planted.jpg`, jpeg, { contentType: 'image/jpeg' });
    expect(error).not.toBeNull();
  });

  it('are private: no link works without signing in, a signed one does', async () => {
    const path = `${alice.userId}/test-${Date.now()}.jpg`;
    const upload = await alice.client.storage
      .from('challenge-photos')
      .upload(path, jpeg, { contentType: 'image/jpeg' });
    expect(upload.error).toBeNull();
    try {
      const publicUrl = alice.client.storage.from('challenge-photos').getPublicUrl(path).data.publicUrl;
      expect((await fetch(publicUrl)).ok).toBe(false);
      const signed = await alice.client.storage.from('challenge-photos').createSignedUrl(path, 60);
      expect(signed.error).toBeNull();
      expect((await fetch(signed.data!.signedUrl)).ok).toBe(true);
    } finally {
      await alice.client.storage.from('challenge-photos').remove([path]);
    }
  });

  it("can't be deleted by someone else", async () => {
    const path = `${alice.userId}/keep-${Date.now()}.jpg`;
    await alice.client.storage.from('challenge-photos').upload(path, jpeg, { contentType: 'image/jpeg' });
    try {
      await bob.client.storage.from('challenge-photos').remove([path]);
      const { data } = await admin.storage.from('challenge-photos').list(alice.userId);
      expect(data?.some((file) => path.endsWith(file.name))).toBe(true);
    } finally {
      await alice.client.storage.from('challenge-photos').remove([path]);
    }
  });
});
