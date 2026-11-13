// Stripe calls this when a payment or refund changes. It has no Supabase
// sign-in (deploy with --no-verify-jwt): Stripe's signature proves the
// message is real, checked with the webhook's signing secret before
// anything else. Answers 500 on a failure, so Stripe sends it again; an
// event already handled is answered without running anything twice.
import Stripe from 'npm:stripe@23.1.0';

import { NEEDS_ATTENTION, processStripeEvent, type StripeEvent } from '../_shared/payments.ts';
import { json, log, serviceDb, setting, stripeApi, stripeClient } from '../_shared/server.ts';

// Deno's Web Crypto, for checking the signature.
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  const stripe = stripeClient();
  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return json({ error: 'No signature.' }, 400);

  // The signature covers the raw body, so read it as text.
  const body = await req.text();
  let event: StripeEvent;
  try {
    event = (await stripe.webhooks.constructEventAsync(
      body,
      signature,
      setting('STRIPE_WEBHOOK_SECRET'),
      undefined,
      cryptoProvider,
    )) as unknown as StripeEvent;
  } catch {
    return json({ error: 'Bad signature.' }, 400);
  }

  try {
    const outcome = await processStripeEvent({ db: serviceDb(), stripe: stripeApi(stripe) }, event);
    // Stripe's event id, its type and the outcome only: nothing personal goes in the log.
    log(NEEDS_ATTENTION.includes(outcome) ? 'error' : 'info', {
      fn: 'stripe-webhook',
      event: event.id,
      type: event.type,
      outcome,
    });
    return json({ received: true });
  } catch (error) {
    log('error', { fn: 'stripe-webhook', event: event.id, type: event.type, outcome: 'failed', error: (error as Error).message });
    return json({ error: 'Not handled; send it again.' }, 500);
  }
});
