import { admin, anonClient, deleteAccount, SEED, signUp, signUpOwner, type Client, type Customer } from './helpers';

/**
 * Guests (Skip on the first screen, an anonymous sign-in) look around: the
 * menu, the pop-ups, the photos of the week. Ordering, changing the
 * profile, adding a photo and reporting one need an account (0042), and
 * members keep doing all of it.
 */

/** A pop-up in the seed, for photo rows. */
const EVENT_ID = '00000000-0000-0000-0000-0000000000e3';
const GUESTS_REFUSED = 'Make an account to do this.';

let guest: Customer;
let member: Customer;
let staff: Customer;

async function signInAsGuest(): Promise<Customer> {
  const client: Client = anonClient();
  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error('Guest sign-in needs anonymous sign-ins on in the local Supabase.');
  const { error: profileError } = await client.rpc('ensure_profile');
  if (profileError) throw profileError;
  return { client, userId: data.user.id, email: '' };
}

/** One bánh mì at the café, as the app asks for it. */
const orderBanhMi = (person: Customer) =>
  person.client.rpc('create_order', {
    p_store_id: SEED.storeId,
    p_event_id: null,
    p_items: [{ menu_item_id: SEED.banhMiPork, quantity: 1 }],
    p_pickup_at: null,
    p_user_reward_id: null,
  });

beforeAll(async () => {
  [guest, member, staff] = await Promise.all([signInAsGuest(), signUp(), signUpOwner()]);
});

afterAll(async () => {
  await Promise.all([guest, member, staff].map((person) => deleteAccount(person)));
});

it('lets a guest look at the menu and the pop-ups', async () => {
  const menu = await guest.client.from('menu_items').select('id').eq('id', SEED.banhMiPork);
  expect(menu.error).toBeNull();
  expect(menu.data).toHaveLength(1);

  const events = await guest.client.from('events').select('id').eq('id', EVENT_ID);
  expect(events.error).toBeNull();
  expect(events.data).toHaveLength(1);
});

it("won't take an order from a guest, and still takes a member's", async () => {
  const refused = await orderBanhMi(guest);
  expect(refused.error?.code).toBe('42501');
  expect(refused.error?.message).toBe(GUESTS_REFUSED);
  const { count } = await admin.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', guest.userId);
  expect(count).toBe(0);

  const taken = await orderBanhMi(member);
  expect(taken.error).toBeNull();
});

it("won't let a guest change their profile, and still lets a member", async () => {
  const refused = await guest.client.from('profiles').update({ name: 'Guest name' }).eq('id', guest.userId);
  expect(refused.error?.message).toBe(GUESTS_REFUSED);
  const left = await admin.from('profiles').select('name').eq('id', guest.userId).single();
  expect(left.data?.name).not.toBe('Guest name');

  const changed = await member.client.from('profiles').update({ name: 'Member name' }).eq('id', member.userId);
  expect(changed.error).toBeNull();
});

it("won't let a guest add a photo or report one", async () => {
  const added = await guest.client.from('photos').insert({
    user_id: guest.userId,
    event_id: EVENT_ID,
    challenge_id: null,
    storage_path: `${guest.userId}/${crypto.randomUUID()}.jpg`,
  });
  expect(added.error?.message).toBe(GUESTS_REFUSED);

  // A member's photo, offered and picked: showing in Photos of the week.
  const { data: photo, error } = await member.client
    .from('photos')
    .insert({
      user_id: member.userId,
      event_id: EVENT_ID,
      challenge_id: null,
      storage_path: `${member.userId}/${crypto.randomUUID()}.jpg`,
    })
    .select('id')
    .single();
  if (error) throw error;
  expect(
    (await member.client.rpc('set_photo_shared' as never, { p_photo_id: photo.id, p_shared: true } as never)).error,
  ).toBeNull();
  expect(
    (await staff.client.rpc('set_photo_featured' as never, { p_photo_id: photo.id, p_featured: true } as never)).error,
  ).toBeNull();

  // A guest sees it, and can't take it down.
  const week = await guest.client.rpc('photos_of_the_week' as never);
  expect(week.error).toBeNull();
  expect((week.data as unknown as { id: string }[]).map((row) => row.id)).toContain(photo.id);

  const report = await guest.client.rpc('report_photo', { p_photo_id: photo.id });
  expect(report.error?.message).toBe(GUESTS_REFUSED);
  const after = await guest.client.rpc('photos_of_the_week' as never);
  expect((after.data as unknown as { id: string }[]).map((row) => row.id)).toContain(photo.id);

  await admin.from('photos').delete().eq('id', photo.id);
});

// Storage isn't in every local stack (CI has it); SKIP_STORAGE_TESTS=1 skips these.
const storage = process.env.SKIP_STORAGE_TESTS === '1' ? describe.skip : describe;

storage('files', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

  it("won't take a guest's challenge photo or profile photo", async () => {
    for (const bucket of ['challenge-photos', 'avatars']) {
      const { error } = await guest.client.storage
        .from(bucket)
        .upload(`${guest.userId}/guest-${Date.now()}.jpg`, jpeg, { contentType: 'image/jpeg' });
      expect(error).not.toBeNull();
    }
  });
});
