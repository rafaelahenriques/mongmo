import { ApiError } from '@/api/errors';
import { supabase } from '@/lib/supabase';

/**
 * Calls one of the payment Edge Functions (supabase/functions) with an
 * order id, signed in as the current user. Their refusals come back with a
 * message that's safe to show; anything else gets `fallback`.
 */
async function callPaymentFunction<T>(name: string, orderId: string, fallback: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body: { orderId } });
  if (!error) return data as T;
  const response = (error as { context?: unknown }).context;
  let message = fallback;
  let status = 500;
  if (response instanceof Response) {
    status = response.status;
    const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
    if (typeof body?.error === 'string' && status < 500) message = body.error;
  }
  throw new ApiError(message, status);
}

/** A payment for exactly this draft order's total, for Stripe's payment sheet. */
export function startOrderPayment(orderId: string): Promise<{ clientSecret: string }> {
  return callPaymentFunction('payment-sheet', orderId, 'Couldn’t start the payment. Try again, or pay at pickup.');
}

/**
 * Asks Stripe to refund a cancelled order that was paid online: the
 * customer's own, or any for staff. Safe to ask twice.
 */
export async function requestRefund(orderId: string): Promise<void> {
  await callPaymentFunction('refund-order', orderId, 'Couldn’t start the refund. Try again.');
}
