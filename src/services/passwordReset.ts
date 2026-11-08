import { supabase } from '@/lib/supabase';
import { authErrorMessage, MIN_PASSWORD_LENGTH } from '@/services/authMessages';

/**
 * "Forgot password", with a 6-digit code instead of a link, so it works
 * the same in the app and on the web without deep links. Supabase emails
 * the code (the Reset Password email template must show {{ .Token }}, see
 * docs/security.md); entering it signs the person in, and the new
 * password is set straight after. Supabase rate-limits both the emails and
 * the attempts at a code.
 */

/** Emails a reset code. Resolves to a message to show, or null when it was sent. */
export async function sendResetCode(email: string): Promise<string | null> {
  const address = email.trim();
  if (!/^\S+@\S+\.\S+$/.test(address)) return 'That email address doesn’t look right.';
  const { error } = await supabase.auth.resetPasswordForEmail(address);
  // Same answer whether or not there's an account with that email, so the
  // form can't be used to find out who has one.
  if (error && error.status !== 400 && error.status !== 404) return authErrorMessage(error);
  return null;
}

/** Checks the code and sets the new password. Resolves to a message to show, or null when done. */
export async function resetWithCode(email: string, code: string, newPassword: string): Promise<string | null> {
  if (!/^\d{6}$/.test(code.trim())) return 'Enter the 6-digit code from the email.';
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  const verified = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
  if (verified.error) {
    const expired = verified.error.code === 'otp_expired' || verified.error.status === 403;
    return expired ? 'That code is wrong or has expired. Ask for a new one.' : authErrorMessage(verified.error);
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? authErrorMessage(error) : null;
}
