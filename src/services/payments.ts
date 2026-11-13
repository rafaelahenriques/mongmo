import { TurboModuleRegistry } from 'react-native';

import { startOrderPayment } from '@/api/payments';
import { env } from '@/lib/env';

/**
 * Paying online with Stripe's payment sheet: card, Apple Pay, Google Pay
 * and Bancontact, whichever the Stripe Dashboard has on. Card details go
 * from the sheet to Stripe and never through the app or our servers.
 * (payments.web.ts: the web version offers pay at pickup only.)
 */

/** Apple Pay's merchant ID, registered in the Apple Developer account (app.json's Stripe plugin). */
export const APPLE_MERCHANT_ID = 'merchant.com.mongmostore.app';

/** Where a bank page (Bancontact, 3-D Secure) sends people back; +native-intent.tsx hands it to Stripe. */
export const STRIPE_RETURN_URL = 'mongmo://stripe-redirect';

/**
 * Whether this install can pay online: it has a Stripe key, and it was
 * built with Stripe's native code (an older build without it offers pay at
 * pickup only, instead of crashing).
 */
export function onlinePaymentAvailable(): boolean {
  return Boolean(env.stripePublishableKey) && TurboModuleRegistry.get('StripeSdk') != null;
}

type StripeSdk = typeof import('@stripe/stripe-react-native');
let sdk: Promise<StripeSdk> | null = null;

/** Stripe's SDK, loaded and set up the first time it's needed (not at startup). */
function stripe(): Promise<StripeSdk> {
  sdk ??= import('@stripe/stripe-react-native').then(async (module) => {
    await module.initStripe({
      publishableKey: env.stripePublishableKey ?? '',
      merchantIdentifier: APPLE_MERCHANT_ID,
      urlScheme: 'mongmo',
    });
    return module;
  });
  sdk.catch(() => {
    sdk = null;
  });
  return sdk;
}

export type PaymentOutcome = 'paid' | 'cancelled';

/**
 * Pays a draft order: asks our server for a payment of exactly its total,
 * then shows Stripe's payment sheet. 'paid' means Stripe accepted the
 * payment; the order is placed when Stripe confirms it to our server.
 * 'cancelled' means they closed the sheet: nothing was charged.
 */
export async function payOrder(orderId: string): Promise<PaymentOutcome> {
  const { clientSecret } = await startOrderPayment(orderId);
  const { initPaymentSheet, presentPaymentSheet } = await stripe();
  const init = await initPaymentSheet({
    merchantDisplayName: 'Mongmo',
    paymentIntentClientSecret: clientSecret,
    returnURL: STRIPE_RETURN_URL,
    // Only methods that confirm straight away: the café needs to know
    // before it starts cooking.
    allowsDelayedPaymentMethods: false,
    applePay: { merchantCountryCode: 'BE' },
    googlePay: { merchantCountryCode: 'BE', currencyCode: 'EUR', testEnv: env.appEnv !== 'production' },
  });
  if (init.error) throw new Error(init.error.localizedMessage ?? 'Couldn’t open the payment. Try again.');

  const result = await presentPaymentSheet();
  if (!result.error) return 'paid';
  if (result.error.code === 'Canceled') return 'cancelled';
  throw new Error(result.error.localizedMessage ?? result.error.message ?? 'The payment didn’t go through.');
}

/** Hands a link back from a bank page to Stripe. True when it was Stripe's. */
export async function handleStripeRedirect(url: string): Promise<boolean> {
  if (!onlinePaymentAvailable()) return false;
  return (await stripe()).handleURLCallback(url);
}
