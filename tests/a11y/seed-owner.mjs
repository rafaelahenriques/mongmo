// Makes the owner account the accessibility walk-through signs in with, and
// one reported photo so Owner tools → Reported photos has something to show.
// Local or CI databases only: it needs the service role key.
//
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… OWNER_EMAIL=… OWNER_PASSWORD=… node tests/a11y/seed-owner.mjs
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
console.log('Owner account and a reported photo are ready.');

async function findUser(address) {
  const { users } = must(await admin.auth.admin.listUsers({ perPage: 1000 }));
  const user = users.find((candidate) => candidate.email === address);
  if (!user) throw new Error(`Couldn't create or find ${address}.`);
  return user.id;
}
