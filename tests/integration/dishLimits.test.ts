import { admin, deleteAccount, SEED, signUp, signUpOwner, type Customer } from './helpers';

/**
 * How many of a dish a place can sell (0044): per day at the café, over the
 * whole of a pop-up. Orders that would go over are refused, saying how many
 * are left; cancelled ones give theirs back. And pre-orders: a pop-up takes
 * orders from 24 hours before it starts, for a time during it.
 */

const CAFE_MENU = '00000000-0000-0000-0000-0000000000d1';
const HOUR = 60 * 60 * 1000;

let owner: Customer;
let member: Customer;
let other: Customer;
const made: string[] = [];

beforeAll(async () => {
  [owner, member, other] = await Promise.all([signUpOwner(), signUp(), signUp()]);
});

afterAll(async () => {
  await owner.client.rpc(
    'set_dish_limits' as never,
    {
      p_store_id: SEED.storeId,
      p_event_id: null,
      p_limits: [{ menu_item_id: SEED.springrollsTofu, max_quantity: null }],
    } as never,
  );
  if (made.length) {
    const orders = await admin.from('orders').delete().in('event_id', made);
    if (orders.error) throw orders.error;
    const events = await admin.from('events').delete().in('id', made);
    if (events.error) throw events.error;
  }
  await Promise.all([owner, member, other].map((person) => deleteAccount(person)));
});

type Stock = { menu_item_id: string; max_quantity: number; sold: number | null; remaining: number };
type Place = { store: string } | { event: string };

const params = (place: Place) => ({
  p_store_id: 'store' in place ? place.store : null,
  p_event_id: 'event' in place ? place.event : null,
});

async function stock(person: Customer, place: Place, item: string): Promise<Stock | undefined> {
  const { data, error } = await person.client.rpc('dish_stock' as never, params(place) as never);
  if (error) throw error;
  return (data as Stock[]).find((row) => row.menu_item_id === item);
}

const setLimit = (person: Customer, place: Place, item: string, max: number | null) =>
  person.client.rpc(
    'set_dish_limits' as never,
    {
      ...params(place),
      p_limits: [{ menu_item_id: item, max_quantity: max }],
    } as never,
  );

/** An order as the app makes it (a draft), not yet paid or placed. */
const draft = (person: Customer, place: Place, item: string, quantity: number, pickupAt: Date | null = null) =>
  person.client.rpc('create_order', {
    ...params(place),
    p_items: [{ menu_item_id: item, quantity }],
    p_pickup_at: pickupAt?.toISOString() ?? null,
    p_user_reward_id: null,
  });

/** The member's order, placed (to pay at pickup). */
async function order(place: Place, item: string, quantity: number, pickupAt: Date | null = null) {
  const made = await draft(member, place, item, quantity, pickupAt);
  if (made.error) return made;
  return member.client.rpc('place_order', { p_order_id: made.data.id });
}

/** A pop-up starting `inHours` from now (negative: started), with the café's menu. */
async function popUp(inHours: number, forHours = 3): Promise<string> {
  const starts = Date.now() + inHours * HOUR;
  const { data, error } = await admin
    .from('events')
    .insert({
      title: 'Limits test pop-up',
      type: 'popup',
      city: 'Kortrijk',
      venue: 'In front of Mongmo',
      latitude: 50.8279,
      longitude: 3.2649,
      starts_at: new Date(starts).toISOString(),
      ends_at: new Date(starts + forHours * HOUR).toISOString(),
      time_zone: 'Europe/Brussels',
    } as never)
    .select('id')
    .single();
  if (error) throw error;
  const id = (data as { id: string }).id;
  made.push(id);
  await admin.from('event_menus').upsert({ event_id: id, menu_id: CAFE_MENU } as never, { ignoreDuplicates: true });
  return id;
}

describe('at the café, per day', () => {
  const cafe = { store: SEED.storeId };
  const item = SEED.springrollsTofu;

  it('sells up to the limit, says how many are left, then refuses', async () => {
    // Other tests order today too: the limit is set from what's already taken.
    expect((await setLimit(owner, cafe, item, 10000)).error).toBeNull();
    const taken = (await stock(owner, cafe, item))!.sold!;
    expect((await setLimit(owner, cafe, item, taken + 3)).error).toBeNull();

    expect((await order(cafe, item, 2)).error).toBeNull();
    expect((await stock(member, cafe, item))?.remaining).toBe(1);

    const over = await order(cafe, item, 2);
    expect(over.error?.message).toMatch(/^Only 1 left of .+\. Order 1 or fewer\.$/);

    const last = await order(cafe, item, 1);
    expect(last.error).toBeNull();
    expect((await stock(member, cafe, item))?.remaining).toBe(0);
    expect((await order(cafe, item, 1)).error?.message).toMatch(/sold out for that day\.$/);

    // A cancelled order gives its dishes back.
    await admin
      .from('orders')
      .update({ status: 'cancelled' } as never)
      .eq('id', (last.data as { id: string }).id);
    expect((await stock(member, cafe, item))?.remaining).toBe(1);
  });

  it('shows customers what is left, and only staff how many were ordered', async () => {
    const seen = await stock(member, cafe, item);
    expect(seen?.sold).toBeNull();
    expect((await stock(owner, cafe, item))?.sold).toEqual(expect.any(Number));
  });

  it('lets only staff set limits', async () => {
    expect((await setLimit(member, cafe, item, 1)).error?.code).toBe('42501');
  });
});

describe('at a pop-up, and pre-orders', () => {
  it('takes pre-orders from 24 hours before, for a time during the pop-up', async () => {
    const later = await popUp(2 * 24);
    const tooEarly = await order({ event: later }, SEED.banhMiPork, 1, new Date(Date.now() + 2 * 24 * HOUR + HOUR));
    expect(tooEarly.error?.message).toMatch(/^Pre-orders open 24 hours before the pop-up starts/);

    const soon = await popUp(2);
    const during = new Date(Date.now() + 3 * HOUR);
    expect((await order({ event: soon }, SEED.banhMiPork, 1, during)).error).toBeNull();
    expect((await order({ event: soon }, SEED.banhMiPork, 1, null)).error?.message).toBe(
      'Pick a time during the pop-up',
    );
    const before = new Date(Date.now() + HOUR);
    expect((await order({ event: soon }, SEED.banhMiPork, 1, before)).error?.message).toBe(
      'Pick a time during the pop-up',
    );
  });

  it('counts a limit over the whole pop-up, pre-orders included', async () => {
    const id = await popUp(-1);
    const place = { event: id };
    expect((await setLimit(owner, place, SEED.banhMiPork, 2)).error).toBeNull();
    expect((await order(place, SEED.banhMiPork, 2)).error).toBeNull();
    expect((await stock(member, place, SEED.banhMiPork))?.remaining).toBe(0);
    expect((await order(place, SEED.banhMiPork, 1)).error?.message).toMatch(/sold out here\.$/);
    // Another dish at the same pop-up has no limit.
    expect((await order(place, SEED.springrollsTofu, 5)).error).toBeNull();
  });

  it("holds an unpaid order's dishes for others, not for the one paying", async () => {
    const place = { event: await popUp(-1) };
    expect((await setLimit(owner, place, SEED.banhMiPork, 2)).error).toBeNull();

    // The member opens the payment and closes it: their 2 are held…
    expect((await draft(member, place, SEED.banhMiPork, 2)).error).toBeNull();
    expect((await stock(other, place, SEED.banhMiPork))?.remaining).toBe(0);
    expect((await draft(other, place, SEED.banhMiPork, 1)).error?.message).toMatch(/sold out here\.$/);

    // …but not from the member, who can change the cart and try again.
    expect((await stock(member, place, SEED.banhMiPork))?.remaining).toBe(2);
    expect((await order(place, SEED.banhMiPork, 1)).error).toBeNull();
  });
});
