/**
 * The web version has no online payment: Stripe's payment sheet is for
 * iOS and Android. People pay at pickup there. Same exports as payments.ts.
 */
export const APPLE_MERCHANT_ID = 'merchant.com.mongmostore.app';
export const STRIPE_RETURN_URL = 'mongmo://stripe-redirect';

export function onlinePaymentAvailable(): boolean {
  return false;
}

export type PaymentOutcome = 'paid' | 'cancelled';

export async function payOrder(): Promise<PaymentOutcome> {
  throw new Error('Paying online isn’t available here. Choose pay at pickup.');
}

export async function handleStripeRedirect(): Promise<boolean> {
  return false;
}
