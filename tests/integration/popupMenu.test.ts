import { admin, deleteAccount, SEED, signUp, signUpOwner, type Customer } from './helpers';

/**
 * A pop-up made in the app sells the café's menu straight away (0043):
 * before, it had no menu, and ordering there failed with "No menu is
 * available for this location".
 */

/** The café's menu (base.sql). */
const CAFE_MENU = '00000000-0000-0000-0000-0000000000d1';

let owner: Customer;
let member: Customer;
const made: string[] = [];

beforeAll(async () => {
  [owner, member] = await Promise.all([signUpOwner(), signUp()]);
});

afterAll(async () => {
  // The order goes first: an order keeps its pop-up from being deleted.
  if (made.length) {
    const orders = await admin.from('orders').delete().in('event_id', made);
    if (orders.error) throw orders.error;
    const events = await admin.from('events').delete().in('id', made);
    if (events.error) throw events.error;
  }
  await Promise.all([owner, member].map((person) => deleteAccount(person)));
});

/** A pop-up the owner makes in the app, on now. */
async function livePopUp(): Promise<string> {
  const now = Date.now();
  const { data, error } = await owner.client
    .from('events')
    .insert({
      title: 'Test pop-up',
      type: 'popup',
      city: 'Kortrijk',
      venue: 'In front of Mongmo',
      latitude: 50.8279,
      longitude: 3.2649,
      starts_at: new Date(now - 60 * 60 * 1000).toISOString(),
      ends_at: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      time_zone: 'Europe/Brussels',
      created_by: owner.userId,
    } as never)
    .select('id')
    .single();
  if (error) throw error;
  const id = (data as { id: string }).id;
  made.push(id);
  return id;
}

it("gives a new pop-up the café's menu", async () => {
  const id = await livePopUp();
  const { data } = await admin.from('event_menus').select('menu_id').eq('event_id', id);
  expect(data?.map((row) => row.menu_id)).toEqual([CAFE_MENU]);
});

it('takes an order at a pop-up made in the app', async () => {
  const id = await livePopUp();
  const { data, error } = await member.client.rpc('create_order', {
    p_store_id: null,
    p_event_id: id,
    p_items: [{ menu_item_id: SEED.banhMiPork, quantity: 1 }],
    p_pickup_at: null,
    p_user_reward_id: null,
  });
  expect(error).toBeNull();
  expect((data as { event_id: string }).event_id).toBe(id);
});

it('lets the owner swap the menu for another', async () => {
  const id = await livePopUp();
  const { error } = await owner.client.from('event_menus').delete().eq('event_id', id).eq('menu_id', CAFE_MENU);
  expect(error).toBeNull();
  const { data } = await admin.from('event_menus').select('menu_id').eq('event_id', id);
  expect(data).toEqual([]);
});
