#!/usr/bin/env node
// Makes (or resets) the account Apple's and Google's reviewers sign in
// with, on staging or production: a confirmed email account on the
// leaderboard, with a collected order at the café and enough points for a
// reward, so every screen has something to show. Run it from your own
// machine with the project's service role key, which never leaves the
// server side; the password is yours to choose and goes in App Store
// Connect and Play Console, not in the repository.
//
//   SUPABASE_URL=https://….supabase.co SUPABASE_SERVICE_ROLE_KEY=… \
//   REVIEWER_EMAIL=review@mongmo-store.com REVIEWER_PASSWORD=… \
//     node scripts/reviewer-account.mjs
//
// Running it again keeps the account, resets its password and adds one
// more collected order. docs/review-notes.md
// has the rest of the reviewer package.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;
const email = process.env.REVIEWER_EMAIL?.trim().toLowerCase();
const password = process.env.REVIEWER_PASSWORD;
if (!url || !serviceKey || !anonKey || !email || !password) {
  console.error(
    'Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, REVIEWER_EMAIL and REVIEWER_PASSWORD.',
  );
  process.exit(1);
}
if (password.length < 12) {
  console.error('Use a REVIEWER_PASSWORD of 12 characters or more: the account is reachable by anyone who has it.');
  process.exit(1);
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, options);
const fail = (step, error) => {
  console.error(`${step}: ${error.message}`);
  process.exit(1);
};

// 1. The account: made once, its password set to the one given.
const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (listError) fail('Listing accounts', listError);
let user = list.users.find((candidate) => candidate.email?.toLowerCase() === email);
if (user) {
  const { error } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) fail('Updating the account', error);
} else {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) fail('Making the account', error);
  user = data.user;
}

// 2. Its profile: a name staff can call, on the leaderboard.
const { error: profileError } = await admin
  .from('profiles')
  .update({ name: 'App Review', leaderboard_visible: true })
  .eq('id', user.id);
if (profileError) fail('Setting up the profile', profileError);

// 3. A collected order at the café, made the way the app makes one.
const reviewer = createClient(url, anonKey, options);
const { error: signInError } = await reviewer.auth.signInWithPassword({ email, password });
if (signInError) fail('Signing in as the reviewer', signInError);
const { data: store, error: storeError } = await admin.from('stores').select('id, menu_id').limit(1).single();
if (storeError) fail('Finding the café', storeError);
const { data: item, error: itemError } = await admin
  .from('menu_items')
  .select('id')
  .eq('menu_id', store.menu_id)
  .eq('available', true)
  .is('add_on_for', null)
  .order('sort_order')
  .limit(1)
  .single();
if (itemError) fail('Finding a dish', itemError);
const { data: order, error: orderError } = await reviewer.rpc('create_order', {
  p_store_id: store.id,
  p_event_id: null,
  p_items: [{ menu_item_id: item.id, quantity: 1 }],
  p_pickup_at: null,
  p_user_reward_id: null,
});
if (orderError) fail('Making an order', orderError);
const { error: placeError } = await reviewer.rpc('place_order', { p_order_id: order.id });
if (placeError) fail('Placing the order', placeError);
// Handed over and paid at the counter, as staff would mark it; that earns its points.
const { error: collectError } = await admin
  .from('orders')
  .update({ status: 'collected', paid_at: new Date().toISOString() })
  .eq('id', order.id);
if (collectError) fail('Marking the order collected', collectError);

// 4. Points for a reward: enough for the cheapest one.
const { data: reward } = await admin
  .from('rewards')
  .select('cost_points')
  .eq('active', true)
  .order('cost_points')
  .limit(1)
  .maybeSingle();
const { data: balance } = await reviewer.rpc('my_points_balance');
const missing = Math.max(0, (reward?.cost_points ?? 0) - (balance ?? 0));
if (missing > 0) {
  const { error } = await admin
    .from('point_events')
    .insert({ user_id: user.id, points: missing, source: 'badge', source_id: crypto.randomUUID() });
  if (error) fail('Adding points', error);
}
await reviewer.auth.signOut();

console.log(`Reviewer account ready: ${email} (one collected order, enough points for a reward).`);
