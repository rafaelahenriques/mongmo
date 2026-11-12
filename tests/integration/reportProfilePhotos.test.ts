import { admin, deleteAccount, signUp, signUpOwner, type Customer } from './helpers';

/**
 * Reporting a profile photo (0034): a report hides it from the leaderboard
 * at once; staff put it back or remove it, and the reports go. Alice has
 * the photo, Bob reports it, Staff decides.
 */
let alice: Customer;
let bob: Customer;
let staff: Customer;

beforeAll(async () => {
  [alice, bob, staff] = await Promise.all([signUp(), signUp(), signUpOwner()]);
  for (const person of [alice, bob]) {
    await person.client.from('profiles').update({ leaderboard_visible: true }).eq('id', person.userId);
  }
});
afterAll(async () => {
  for (const person of [alice, bob, staff]) {
    await person.client.from('profiles').update({ avatar_path: null }).eq('id', person.userId);
    await deleteAccount(person);
  }
});

const photoOnBoard = async (userId: string) => {
  const { data, error } = await bob.client.rpc('leaderboard', { p_period: 'all' });
  expect(error).toBeNull();
  return data!.find((row) => row.user_id === userId)?.avatar_path ?? null;
};
const reportCount = async () =>
  (
    await admin
      .from('profile_photo_reports' as never)
      .select('*')
      .eq('user_id', alice.userId)
  ).data?.length ?? 0;
const report = (by: Customer) => by.client.rpc('report_profile_photo', { p_user_id: alice.userId });

async function freshPhoto(): Promise<string> {
  const path = `${alice.userId}/me-${Date.now()}.jpg`;
  await alice.client.from('profiles').update({ avatar_path: path }).eq('id', alice.userId);
  return path;
}

it('hides the photo at once, for everyone but its owner', async () => {
  const path = await freshPhoto();
  expect(await photoOnBoard(alice.userId)).toBe(path);

  expect((await report(bob)).error).toBeNull();
  expect(await photoOnBoard(alice.userId)).toBeNull();
  expect((await bob.client.rpc('is_leaderboard_avatar' as never, { p_path: path } as never)).data).toBe(false);

  const { data: own } = await alice.client.from('profiles').select('avatar_path, avatar_hidden_at').single();
  expect(own!.avatar_path).toBe(path);
  expect(own!.avatar_hidden_at).not.toBeNull();
  expect(await reportCount()).toBe(1);
});

it("can't be undone by the person, and a new photo stays hidden too", async () => {
  await alice.client
    .from('profiles')
    .update({ avatar_hidden_at: null } as never)
    .eq('id', alice.userId);
  await freshPhoto();
  expect(await photoOnBoard(alice.userId)).toBeNull();
});

it('is for staff alone to review', async () => {
  expect((await bob.client.rpc('reported_profile_photos')).data).toEqual([]);
  expect(
    (await bob.client.rpc('review_reported_profile_photo', { p_user_id: alice.userId, p_restore: true })).error,
  ).not.toBeNull();
  const { data } = await staff.client.rpc('reported_profile_photos');
  expect(data!.find((row) => row.user_id === alice.userId)).toMatchObject({ reports: 1 });
});

it('shows again when staff put it back, and the reports go', async () => {
  const { data: before } = await admin.from('profiles').select('avatar_path').eq('id', alice.userId).single();
  expect(
    (await staff.client.rpc('review_reported_profile_photo', { p_user_id: alice.userId, p_restore: true })).error,
  ).toBeNull();
  expect(await photoOnBoard(alice.userId)).toBe(before!.avatar_path);
  expect(await reportCount()).toBe(0);
  expect(
    (await staff.client.rpc('review_reported_profile_photo', { p_user_id: alice.userId, p_restore: true })).error,
  ).not.toBeNull();
});

it('is gone when staff remove it', async () => {
  await freshPhoto();
  await report(bob);
  expect(
    (await staff.client.rpc('review_reported_profile_photo', { p_user_id: alice.userId, p_restore: false })).error,
  ).toBeNull();
  const { data } = await admin.from('profiles').select('avatar_path, avatar_hidden_at').eq('id', alice.userId).single();
  expect(data).toEqual({ avatar_path: null, avatar_hidden_at: null });
  expect(await reportCount()).toBe(0);
});

it("can't be used on your own photo, or on someone with no photo on the board", async () => {
  await freshPhoto();
  expect((await alice.client.rpc('report_profile_photo', { p_user_id: alice.userId })).error).not.toBeNull();
  expect((await bob.client.rpc('report_profile_photo', { p_user_id: staff.userId })).error).not.toBeNull();
  await alice.client.from('profiles').update({ leaderboard_visible: false }).eq('id', alice.userId);
  expect((await report(bob)).error).not.toBeNull();
  await alice.client.from('profiles').update({ leaderboard_visible: true }).eq('id', alice.userId);
});

it('keeps who reported whom from members', async () => {
  expect((await bob.client.from('profile_photo_reports' as never).select('*')).error).not.toBeNull();
});

// Photo files live in Supabase Storage. CI runs it; a local stack without
// it can skip these with SKIP_STORAGE_TESTS=1.
const storage = process.env.SKIP_STORAGE_TESTS === '1' ? describe.skip : describe;

storage('photo files', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

  it('can be seen and deleted by staff only while hidden after a report', async () => {
    const path = `${alice.userId}/reported-${Date.now()}.jpg`;
    await alice.client.storage.from('avatars').upload(path, jpeg, { contentType: 'image/jpeg' });
    const exists = async () =>
      ((await admin.storage.from('avatars').list(alice.userId)).data ?? []).some((file) => path.endsWith(file.name));
    try {
      await alice.client.from('profiles').update({ avatar_path: path }).eq('id', alice.userId);
      await staff.client.storage.from('avatars').remove([path]);
      expect(await exists()).toBe(true);

      await report(bob);
      expect((await bob.client.storage.from('avatars').createSignedUrl(path, 60)).error).not.toBeNull();
      expect((await staff.client.storage.from('avatars').createSignedUrl(path, 60)).error).toBeNull();
      await staff.client.storage.from('avatars').remove([path]);
      expect(await exists()).toBe(false);
      await staff.client.rpc('review_reported_profile_photo', { p_user_id: alice.userId, p_restore: false });
    } finally {
      await alice.client.storage.from('avatars').remove([path]);
    }
  });
});
