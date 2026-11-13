// Deno side of the payment Edge Functions: settings, clients, the caller's
// sign-in, and JSON answers. The logic itself is in payments.ts.
//
// Supabase sets SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
// in every Edge Function. The Stripe keys are secrets set on the project
// (docs/DEPLOYMENT.md): they never go in the app.
import Stripe from 'npm:stripe@23.1.0';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

import { PaymentError, type Db, type StripeApi } from './payments.ts';

export function setting(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} isn't set for this function`);
  return value;
}

export function stripeClient(): Stripe {
  return new Stripe(setting('STRIPE_SECRET_KEY'));
}

/** Stripe's client, as the parts payments.ts uses. */
export function stripeApi(stripe: Stripe): StripeApi {
  return stripe as unknown as StripeApi;
}

/** The database as the service role: only the Edge Functions hold this key. */
export function serviceDb(): Db {
  return createClient(setting('SUPABASE_URL'), setting('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The signed-in user calling the function, from their access token; null if there isn't one. */
export async function callerId(req: Request): Promise<string | null> {
  const authorization = req.headers.get('Authorization');
  if (!authorization) return null;
  const client = createClient(setting('SUPABASE_URL'), setting('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  return error || !data.user ? null : data.user.id;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The orderId in a JSON body, checked. */
export async function orderIdFrom(req: Request): Promise<string> {
  const body = (await req.json().catch(() => null)) as { orderId?: unknown } | null;
  const orderId = body?.orderId;
  if (typeof orderId !== 'string' || !UUID.test(orderId)) throw new PaymentError('Which order?', 400);
  return orderId;
}

/**
 * A signed-in user's POST: runs `handle` with their id and the order, and
 * answers with what it returns. Refusals keep their safe message; anything
 * else is logged without personal data and answered with a general one.
 */
export function serveForUser(
  name: string,
  handle: (userId: string, orderId: string) => Promise<unknown>,
): void {
  Deno.serve(async (req) => {
    if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
    try {
      const userId = await callerId(req);
      if (!userId) return json({ error: 'Sign in first.' }, 401);
      return json(await handle(userId, await orderIdFrom(req)));
    } catch (error) {
      if (error instanceof PaymentError) return json({ error: error.message }, error.status);
      console.error(`${name} failed: ${(error as Error).name}`);
      return json({ error: 'Something went wrong. Try again.' }, 500);
    }
  });
}
