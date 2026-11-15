import { supabase } from '@/lib/supabase';
import { authErrorMessage } from '@/services/authMessages';

/**
 * Confirming a new account's email with a 6-digit code typed into the
 * app, like the password reset. A link in the email needs somewhere to
 * land: on a phone that's a deep link, on a computer a web page, and with
 * neither set up it lands on "localhost". Supabase emails the code (the
 * Confirm signup template must show {{ .Token }}, see docs/security.md);
 * entering it signs the person in.
 */

/**
 * True when signing up found an account that already exists. With email
 * confirmations on, Supabase answers a sign-up for a taken address as if
 * it had worked, but with a user that has no identities, and sends
 * nothing: the person would wait for an email that never comes.
 */
export function alreadyRegistered(user: { identities?: unknown[] | null } | null | undefined): boolean {
  return Array.isArray(user?.identities) && user.identities.length === 0;
}

/** Checks the code. Resolves to a message to show, or null when it's confirmed (and they're signed in). */
export async function confirmWithCode(email: string, code: string): Promise<string | null> {
  if (!/^\d{6}$/.test(code.trim())) return 'Enter the 6-digit code from the email.';
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'signup' });
  if (!error) return null;
  const expired = error.code === 'otp_expired' || error.status === 403;
  return expired ? 'That code is wrong or has expired. Ask for a new one.' : authErrorMessage(error);
}

/** Emails the code again. Resolves to a message to show, or null when it was sent. */
export async function resendConfirmation(email: string): Promise<string | null> {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
  return error ? authErrorMessage(error) : null;
}
