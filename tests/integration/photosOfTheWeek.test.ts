import { admin, deleteAccount, signUp, signUpOwner, type Client, type Customer } from './helpers';

/**
 * Challenge photos are private to the person and staff. The person can
 * offer one for Photos of the week (0029); it shows once staff pick it
 * (0040). Alice takes the photos, Bob is another member, Staff is a Mongmo
 * owner.
 */
const EVENT_ID = '00000000-0000-0000-0000-0000000000e3';

let alice: Customer;
let bob: Customer;
let staff: Customer;

beforeAll(async () => {
  [alice, bob, staff] = await Promise.all([signUp(), signUp(), signUpOwner()]);
});
afterAll(async () => {
  await Promise.all([deleteAccount(alice), deleteAccount(bob), deleteAccount(staff)]);
});

/** A photo record of Alice's (the file itself isn't needed for these rules). */
async function alicePhoto(): Promise<string> {
  const { data, error } = await alice.client
    .from('photos')
    .insert({
      user_id: alice.userId,
      event_id: EVENT_ID,
      challenge_id: null,
      storage_path: `${alice.userId}/${crypto.randomUUID()}.jpg`,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

type WeekPhoto = { id: string; storage_path: string; event_title: string; mine: boolean };
async function photosOfTheWeek(person: Customer): Promise<WeekPhoto[]> {
  const { data, error } = await person.client.rpc('photos_of_the_week' as never);
  if (error) throw error;
  return data as WeekPhoto[];
}
const share = (client: Client, id: string, shared = true) =>
  client.rpc('set_photo_shared' as never, { p_photo_id: id, p_shared: shared } as never);
const pick = (person: Customer, id: string, featured = true) =>
  person.client.rpc('set_photo_featured' as never, { p_photo_id: id, p_featured: featured } as never);
/** Alice offers the photo and staff pick it: it's showing. */
async function showing(id: string): Promise<void> {
  expect((await share(alice.client, id)).error).toBeNull();
  expect((await pick(staff, id)).error).toBeNull();
}
/** What the storage rule asks before another member may open the file. */
async function fileShows(person: Customer, id: string): Promise<boolean> {
  const row = await admin.from('photos').select('storage_path').eq('id', id).single();
  const { data, error } = await person.client.rpc(
    'is_photo_of_the_week' as never,
    { p_path: (row.data as { storage_path: string }).storage_path } as never,
  );
  if (error) throw error;
  return data as boolean;
}
type OfferedPhoto = { id: string; showing: boolean };
async function offered(person: Customer): Promise<OfferedPhoto[]> {
  const { data, error } = await person.client.rpc('offered_photos' as never);
  if (error) throw error;
  return data as OfferedPhoto[];
}

it('keeps a photo private to the person and staff until it is shared', async () => {
  const id = await alicePhoto();
  expect((await bob.client.from('photos').select('id').eq('id', id)).data).toEqual([]);
  expect((await staff.client.from('photos').select('id').eq('id', id)).data).toHaveLength(1);
  expect((await photosOfTheWeek(bob)).map((photo) => photo.id)).not.toContain(id);
});

it('offers a shared photo to staff only: it shows nowhere until they pick it', async () => {
  const id = await alicePhoto();
  expect((await share(alice.client, id)).error).toBeNull();

  expect((await photosOfTheWeek(bob)).map((photo) => photo.id)).not.toContain(id);
  expect(await fileShows(bob, id)).toBe(false);
  expect((await offered(staff)).find((photo) => photo.id === id)).toMatchObject({ showing: false });
  // The list of what's offered is for staff: other members get nothing.
  expect(await offered(bob)).toEqual([]);
});

it('shows a photo staff picked to other members, without who took it', async () => {
  const id = await alicePhoto();
  await showing(id);
  expect((await offered(staff)).find((photo) => photo.id === id)).toMatchObject({ showing: true });
  expect(await fileShows(bob, id)).toBe(true);

  const seenByBob = (await photosOfTheWeek(bob)).find((photo) => photo.id === id);
  expect(seenByBob).toMatchObject({ mine: false, event_title: expect.any(String) });
  expect(Object.keys(seenByBob!)).not.toContain('user_id');
  expect((await photosOfTheWeek(alice)).find((photo) => photo.id === id)?.mine).toBe(true);
  // Still not readable as a record: only through the week's list.
  expect((await bob.client.from('photos').select('id').eq('id', id)).data).toEqual([]);

  // Alice's own data export says when it was picked.
  const exported = await alice.client.rpc('export_my_data');
  const photos = (exported.data as { photos: Record<string, unknown>[] }).photos;
  expect(photos.some((photo) => typeof photo.picked_for_photos_of_the_week_at === 'string')).toBe(true);
});

it('stops showing a photo once the person stops sharing it, and sharing again needs a new pick', async () => {
  const id = await alicePhoto();
  await showing(id);
  expect((await share(alice.client, id, false)).error).toBeNull();
  expect((await photosOfTheWeek(bob)).map((photo) => photo.id)).not.toContain(id);
  expect((await offered(staff)).map((photo) => photo.id)).not.toContain(id);

  await share(alice.client, id);
  expect((await photosOfTheWeek(bob)).map((photo) => photo.id)).not.toContain(id);
});

it('lets staff take a photo out again, and only staff pick', async () => {
  const id = await alicePhoto();
  await showing(id);
  expect((await pick(staff, id, false)).error).toBeNull();
  expect((await photosOfTheWeek(bob)).map((photo) => photo.id)).not.toContain(id);

  // Not the person who took it, not another member.
  expect((await pick(alice, id)).error?.code).toBe('42501');
  expect((await pick(bob, id)).error?.code).toBe('42501');
  expect((await photosOfTheWeek(bob)).map((photo) => photo.id)).not.toContain(id);
});

it("won't let staff pick a photo that isn't offered", async () => {
  const id = await alicePhoto();
  expect((await pick(staff, id)).error?.code).toBe('P0002');
});

it("keeps an old offer out of staff's list, unless it's showing", async () => {
  const days = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
  const id = await alicePhoto();
  await showing(id);
  // Offered long ago, picked two days ago: staff can still take it out.
  await admin
    .from('photos')
    .update({ shared_at: days(40), featured_at: days(2) } as never)
    .eq('id', id);
  expect((await offered(staff)).find((photo) => photo.id === id)).toMatchObject({ showing: true });
  // Its week over, the offer is too old to pick again.
  await admin
    .from('photos')
    .update({ featured_at: days(8) } as never)
    .eq('id', id);
  expect((await offered(staff)).map((photo) => photo.id)).not.toContain(id);
  expect((await pick(staff, id)).error?.code).toBe('P0002');
});

it('shows a picked photo for a week', async () => {
  const id = await alicePhoto();
  await showing(id);
  await admin
    .from('photos')
    .update({ featured_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() } as never)
    .eq('id', id);
  expect((await photosOfTheWeek(bob)).map((photo) => photo.id)).not.toContain(id);
});

it("won't let anyone share someone else's photo, or start one shared", async () => {
  const id = await alicePhoto();
  expect((await share(bob.client, id)).error).not.toBeNull();
  expect((await photosOfTheWeek(bob)).map((photo) => photo.id)).not.toContain(id);

  for (const column of ['shared_at', 'featured_at']) {
    const planted = await alice.client.from('photos').insert({
      user_id: alice.userId,
      event_id: EVENT_ID,
      challenge_id: null,
      storage_path: `${alice.userId}/${crypto.randomUUID()}.jpg`,
      [column]: new Date().toISOString(),
    } as never);
    expect(planted.error).not.toBeNull();
  }
  // Nor by changing the row afterwards: photos take no direct updates.
  await alice.client
    .from('photos')
    .update({ featured_at: new Date().toISOString() } as never)
    .eq('id', id);
  await share(alice.client, id);
  expect((await photosOfTheWeek(bob)).map((photo) => photo.id)).not.toContain(id);
});

it('takes a reported photo down at once, keeps it from being shared again, and tells staff', async () => {
  const id = await alicePhoto();
  await showing(id);
  expect((await bob.client.rpc('report_photo' as never, { p_photo_id: id } as never)).error).toBeNull();

  expect((await photosOfTheWeek(bob)).map((photo) => photo.id)).not.toContain(id);
  expect((await share(alice.client, id)).error).not.toBeNull();
  const reports = await staff.client
    .from('photo_reports' as never)
    .select('photo_id')
    .eq('photo_id', id);
  expect(reports.data).toHaveLength(1);
  expect(
    (
      await bob.client
        .from('photo_reports' as never)
        .select('photo_id')
        .eq('photo_id', id)
    ).data,
  ).toEqual([]);
});

it('only shares photos from the last week', async () => {
  const id = await alicePhoto();
  await admin
    .from('photos')
    .update({ created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() })
    .eq('id', id);
  expect((await share(alice.client, id)).error).not.toBeNull();
});

describe('staff reviewing reports', () => {
  type Reported = { id: string; event_title: string; reports: number };
  const reported = async (person: Customer) => {
    const { data, error } = await person.client.rpc('reported_photos' as never);
    if (error) throw error;
    return data as Reported[];
  };
  const review = (person: Customer, id: string, restore: boolean) =>
    person.client.rpc('review_reported_photo' as never, { p_photo_id: id, p_restore: restore } as never);
  /** A photo of Alice's, showing, then reported by Bob. */
  async function reportedPhoto(): Promise<string> {
    const id = await alicePhoto();
    await showing(id);
    const { error } = await bob.client.rpc('report_photo' as never, { p_photo_id: id } as never);
    if (error) throw error;
    return id;
  }
  const reportsOf = async (id: string) =>
    (
      await admin
        .from('photo_reports' as never)
        .select('photo_id')
        .eq('photo_id', id)
    ).data ?? [];

  it('lists reported photos for staff only, with how many reports', async () => {
    const id = await reportedPhoto();
    expect((await reported(staff)).find((photo) => photo.id === id)).toMatchObject({ reports: 1 });
    expect(await reported(bob)).toEqual([]);
    expect((await review(bob, id, true)).error).not.toBeNull();
    expect((await bob.client.rpc('delete_reported_photo' as never, { p_photo_id: id } as never)).error).not.toBeNull();
  });

  it('puts a photo back: it shows again and the reports are deleted', async () => {
    const id = await reportedPhoto();
    expect((await review(staff, id, true)).error).toBeNull();
    expect((await photosOfTheWeek(bob)).map((photo) => photo.id)).toContain(id);
    expect((await reported(staff)).map((photo) => photo.id)).not.toContain(id);
    expect(await reportsOf(id)).toEqual([]);
  });

  it('keeps a photo down: private to the person, never shared again, reports deleted', async () => {
    const id = await reportedPhoto();
    expect((await review(staff, id, false)).error).toBeNull();
    expect((await photosOfTheWeek(bob)).map((photo) => photo.id)).not.toContain(id);
    expect((await alice.client.from('photos').select('id').eq('id', id)).data).toHaveLength(1);
    expect((await share(alice.client, id)).error).not.toBeNull();
    expect(await reportsOf(id)).toEqual([]);
    expect((await review(staff, id, true)).error).not.toBeNull(); // already decided
  });

  it('deletes a reported photo for good', async () => {
    const id = await reportedPhoto();
    expect((await staff.client.rpc('delete_reported_photo' as never, { p_photo_id: id } as never)).error).toBeNull();
    expect((await admin.from('photos').select('id').eq('id', id)).data).toEqual([]);
    expect(await reportsOf(id)).toEqual([]);
  });

  it("won't let staff delete a photo nobody reported", async () => {
    const id = await alicePhoto();
    const { error } = await staff.client.rpc('delete_reported_photo' as never, { p_photo_id: id } as never);
    expect(error).not.toBeNull();
    expect((await admin.from('photos').select('id').eq('id', id)).data).toHaveLength(1);
  });
});

// Photo files live in Supabase Storage. CI runs it; a local stack without
// it can skip these with SKIP_STORAGE_TESTS=1.
const storage = process.env.SKIP_STORAGE_TESTS === '1' ? describe.skip : describe;

storage('photo files', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

  it("can be opened by another member only while they're a photo of the week", async () => {
    const path = `${alice.userId}/week-${Date.now()}.jpg`;
    expect(
      (await alice.client.storage.from('challenge-photos').upload(path, jpeg, { contentType: 'image/jpeg' })).error,
    ).toBeNull();
    try {
      const { data } = await alice.client
        .from('photos')
        .insert({ user_id: alice.userId, event_id: EVENT_ID, challenge_id: null, storage_path: path })
        .select('id')
        .single();
      const bobsLink = () => bob.client.storage.from('challenge-photos').createSignedUrl(path, 60);

      expect((await bobsLink()).error).not.toBeNull();
      expect((await staff.client.storage.from('challenge-photos').createSignedUrl(path, 60)).error).toBeNull();

      // Shared is only an offer: the file opens for others once staff pick it.
      await share(alice.client, data!.id);
      expect((await bobsLink()).error).not.toBeNull();
      expect((await pick(staff, data!.id)).error).toBeNull();
      expect((await bobsLink()).error).toBeNull();

      await share(alice.client, data!.id, false);
      expect((await bobsLink()).error).not.toBeNull();
    } finally {
      await alice.client.storage.from('challenge-photos').remove([path]);
    }
  });

  it('can be deleted by staff only once taken down', async () => {
    const path = `${alice.userId}/reported-${Date.now()}.jpg`;
    await alice.client.storage.from('challenge-photos').upload(path, jpeg, { contentType: 'image/jpeg' });
    const exists = async () =>
      ((await admin.storage.from('challenge-photos').list(alice.userId)).data ?? []).some((file) =>
        path.endsWith(file.name),
      );
    try {
      const { data } = await alice.client
        .from('photos')
        .insert({ user_id: alice.userId, event_id: EVENT_ID, challenge_id: null, storage_path: path })
        .select('id')
        .single();
      await staff.client.storage.from('challenge-photos').remove([path]);
      expect(await exists()).toBe(true);

      await showing(data!.id);
      await bob.client.rpc('report_photo' as never, { p_photo_id: data!.id } as never);
      await staff.client.storage.from('challenge-photos').remove([path]);
      expect(await exists()).toBe(false);
    } finally {
      await alice.client.storage.from('challenge-photos').remove([path]);
    }
  });
});
