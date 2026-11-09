import { admin, deleteAccount, signUp, type Customer } from './helpers';

/**
 * Profile photos (0033): each person's own, in their folder of the private
 * `avatars` bucket. Other members see one only while it's the person's
 * current photo and they're on the leaderboard. Alice has the photo, Bob is
 * another member.
 */
let alice: Customer;
let bob: Customer;

beforeAll(async () => {
  [alice, bob] = await Promise.all([signUp(), signUp()]);
  await Promise.all(
    [alice, bob].map(async (person) =>
      expect(
        (await person.client.from('profiles').update({ leaderboard_visible: true }).eq('id', person.userId)).error,
      ).toBeNull(),
    ),
  );
});
afterAll(async () => {
  for (const person of [alice, bob]) {
    await person.client.from('profiles').update({ avatar_path: null }).eq('id', person.userId);
    await deleteAccount(person);
  }
});

const setPhoto = (person: Customer, path: string | null) =>
  person.client.from('profiles').update({ avatar_path: path }).eq('id', person.userId);

const leaderboardPhoto = async (viewer: Customer, userId: string) => {
  const { data, error } = await viewer.client.rpc('leaderboard', { p_period: 'all' });
  expect(error).toBeNull();
  return data!.find((row) => row.user_id === userId)?.avatar_path;
};

it('can only point at a file in your own folder', async () => {
  expect((await setPhoto(alice, `${alice.userId}/me.jpg`)).error).toBeNull();
  expect((await setPhoto(alice, `${bob.userId}/me.jpg`)).error?.code).toBe('23514');
  expect((await setPhoto(alice, `${alice.userId}/../${bob.userId}/me.jpg`)).error?.code).toBe('23514');
  expect((await setPhoto(alice, null)).error).toBeNull();
});

it("can't be set on someone else's profile", async () => {
  await bob.client
    .from('profiles')
    .update({ avatar_path: `${bob.userId}/x.jpg` })
    .eq('id', alice.userId);
  const { data } = await admin.from('profiles').select('avatar_path').eq('id', alice.userId).single();
  expect(data!.avatar_path).toBeNull();
});

it('comes with your row on the leaderboard, and goes when you leave it', async () => {
  const path = `${alice.userId}/board.jpg`;
  await setPhoto(alice, path);
  expect(await leaderboardPhoto(bob, alice.userId)).toBe(path);
  expect((await bob.client.rpc('is_leaderboard_avatar' as never, { p_path: path } as never)).data).toBe(true);

  await alice.client.from('profiles').update({ leaderboard_visible: false }).eq('id', alice.userId);
  expect(await leaderboardPhoto(bob, alice.userId)).toBeUndefined();
  expect((await bob.client.rpc('is_leaderboard_avatar' as never, { p_path: path } as never)).data).toBe(false);

  await alice.client.from('profiles').update({ leaderboard_visible: true }).eq('id', alice.userId);
  await setPhoto(alice, null);
});

it('lists files for the retention job to the service role only', async () => {
  expect((await alice.client.rpc('retention_avatar_paths' as never)).error).not.toBeNull();
  expect((await admin.rpc('retention_avatar_paths' as never)).error).toBeNull();
});

// Photo files live in Supabase Storage. CI runs it; a local stack without
// it can skip these with SKIP_STORAGE_TESTS=1.
const storage = process.env.SKIP_STORAGE_TESTS === '1' ? describe.skip : describe;

storage('photo files', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const upload = (person: Customer, path: string) =>
    person.client.storage.from('avatars').upload(path, jpeg, { contentType: 'image/jpeg' });

  it('go only in your own folder', async () => {
    expect((await upload(bob, `${alice.userId}/bob-${Date.now()}.jpg`)).error).not.toBeNull();
  });

  it("can be opened by another member only while it's the person's photo on the leaderboard", async () => {
    const path = `${alice.userId}/photo-${Date.now()}.jpg`;
    expect((await upload(alice, path)).error).toBeNull();
    const bobsLink = () => bob.client.storage.from('avatars').createSignedUrl(path, 60);
    try {
      expect((await alice.client.storage.from('avatars').createSignedUrl(path, 60)).error).toBeNull();
      expect((await bobsLink()).error).not.toBeNull();

      await setPhoto(alice, path);
      expect((await bobsLink()).error).toBeNull();

      await alice.client.from('profiles').update({ leaderboard_visible: false }).eq('id', alice.userId);
      expect((await bobsLink()).error).not.toBeNull();
    } finally {
      await alice.client.from('profiles').update({ leaderboard_visible: true }).eq('id', alice.userId);
      await setPhoto(alice, null);
      await alice.client.storage.from('avatars').remove([path]);
    }
  });

  it("can't be deleted by anyone else, and hold up deleting the account until they're gone", async () => {
    const carol = await signUp();
    const path = `${carol.userId}/photo-${Date.now()}.jpg`;
    await upload(carol, path);
    const exists = async () =>
      ((await admin.storage.from('avatars').list(carol.userId)).data ?? []).some((file) => path.endsWith(file.name));

    await bob.client.storage.from('avatars').remove([path]);
    expect(await exists()).toBe(true);

    expect((await carol.client.rpc('delete_my_account')).error).not.toBeNull();
    await carol.client.storage.from('avatars').remove([path]);
    expect(await exists()).toBe(false);
    expect((await carol.client.rpc('delete_my_account')).error).toBeNull();
  });
});
