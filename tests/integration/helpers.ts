import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

/**
 * Clients for the local Supabase: `admin` (service role, test setup and
 * checks only, never in the app) and one signed-in client per customer.
 */
export type Client = SupabaseClient<Database>;

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const url = process.env.SUPABASE_URL!;

export const admin: Client = createClient<Database>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, options);
export const anonClient = (): Client => createClient<Database>(url, process.env.SUPABASE_ANON_KEY!, options);

/** Seed data (supabase/seed.sql). */
export const SEED = {
  storeId: '00000000-0000-0000-0000-000000000001',
  banhMiPork: '00000000-0000-0000-0000-0000000000d3',
  springrollsTofu: '00000000-0000-0000-0000-0000000000d8',
  extraProtein: '00000000-0000-0000-0000-0000000000da',
  mangoDip: '00000000-0000-0000-0000-0000000000db',
  toteReward: '00000000-0000-0000-0000-0000000000a5',
  stewReward: '00000000-0000-0000-0000-0000000000a6',
};

export type Customer = { client: Client; userId: string; email: string };

/** A new customer, signed up and signed in, with their profile. */
export async function signUp(): Promise<Customer> {
  const client = anonClient();
  const email = `test-${crypto.randomUUID()}@example.test`;
  const { data, error } = await client.auth.signUp({ email, password: `pw-${crypto.randomUUID()}` });
  if (error) throw error;
  if (!data.session || !data.user) throw new Error('Sign-up needs email confirmations off in the local Supabase.');
  const { error: profileError } = await client.rpc('ensure_profile');
  if (profileError) throw profileError;
  return { client, userId: data.user.id, email };
}

/** A new owner: a customer promoted the way the café promotes staff. */
export async function signUpOwner(): Promise<Customer> {
  const owner = await signUp();
  const { error } = await admin.from('profiles').update({ role: 'owner' }).eq('id', owner.userId);
  if (error) throw error;
  return owner;
}

/** Points as if earned from badges, for tests that need a balance. */
export async function givePoints(userId: string, points: number): Promise<void> {
  const { error } = await admin
    .from('point_events')
    .insert({ user_id: userId, points, source: 'badge', source_id: crypto.randomUUID() });
  if (error) throw error;
}

/** Places and pays an order at the café, through the same RPCs as the app. */
export async function placeOrder(
  customer: Customer,
  items: { menu_item_id: string; quantity: number; options?: string[] }[],
  userRewardId: string | null = null,
) {
  const { data: order, error } = await customer.client.rpc('create_order', {
    p_store_id: SEED.storeId,
    p_event_id: null,
    p_items: items,
    p_pickup_at: null,
    p_user_reward_id: userRewardId,
  });
  if (error) throw error;
  const { data: paid, error: payError } = await customer.client.rpc('confirm_mock_payment', { p_order_id: order.id });
  if (payError) throw payError;
  return paid;
}

/** Deletes an account the way the app does (the database cascade), for clean-up. */
export async function deleteAccount(customer: Customer): Promise<void> {
  const { error } = await customer.client.rpc('delete_my_account');
  if (error) throw error;
}
