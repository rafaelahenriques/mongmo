// Makes the owner account the accessibility walk-through signs in with, one
// reported photo so Owner tools → Reported photos has something to show, and
// two photos shared for Photos of the week (one of them picked) so Owner
// tools → Photos of the week and Home do too.
// Local or CI databases only: it needs the service role key.
//
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… OWNER_EMAIL=… OWNER_PASSWORD=… node tests/a11y/seed-owner.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.OWNER_EMAIL;
const password = process.env.OWNER_PASSWORD;
if (!url || !key || !email || !password) {
  throw new Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OWNER_EMAIL and OWNER_PASSWORD.');
}
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  throw new Error(`Refusing to seed ${url}: local databases only.`);
}
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const must = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
const userId = created.data.user?.id ?? (await findUser(email));
must(await admin.from('profiles').upsert({ id: userId, name: 'Staff', role: 'owner' }));

const { id: photoId } = must(
  await admin
    .from('photos')
    .insert({
      user_id: userId,
      event_id: '00000000-0000-0000-0000-0000000000e3',
      storage_path: `${userId}/a11y-reported.jpg`,
      shared_at: new Date().toISOString(),
      removed_at: new Date().toISOString(),
    })
    .select('id')
    .single(),
);
must(await admin.from('photo_reports').insert({ photo_id: photoId, reporter_id: userId }));

// The shared photos need a file to show. Storage runs in CI; a local stack
// without it keeps the records, and the screens show their empty states.
const picture = readFileSync(new URL('../../assets/images/photos/banh-mi.jpg', import.meta.url));
const now = new Date().toISOString();
for (const [name, picked] of [
  ['a11y-shared', false],
  ['a11y-picked', true],
]) {
  const path = `${userId}/${name}.jpg`;
  const uploaded = await admin.storage
    .from('challenge-photos')
    .upload(path, picture, { contentType: 'image/jpeg', upsert: true })
    .catch((error) => ({ error }));
  if (uploaded.error) console.log(`No file for ${name} (${uploaded.error.message}): it won't show.`);
  must(
    await admin.from('photos').insert({
      user_id: userId,
      event_id: '00000000-0000-0000-0000-0000000000e3',
      storage_path: path,
      shared_at: now,
      featured_at: picked ? now : null,
    }),
  );
}
console.log('Owner account, a reported photo and two shared photos are ready.');

async function findUser(address) {
  const { users } = must(await admin.auth.admin.listUsers({ perPage: 1000 }));
  const user = users.find((candidate) => candidate.email === address);
  if (!user) throw new Error(`Couldn't create or find ${address}.`);
  return user.id;
}
