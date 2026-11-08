import { log } from '@/lib/log';

/** New passwords need at least this many characters (set the same in Supabase → Auth → Password). */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * What to tell someone when signing in, signing up or changing a password
 * fails: a sentence for each case we know, and a general one for the rest.
 * The server's own text can name internals ("Database error saving new
 * user"), so it's logged, scrubbed, and never shown.
 */
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'That email and password don’t match.',
  user_already_exists: 'There’s already an account with that email. Sign in instead.',
  email_exists: 'There’s already an account with that email. Sign in instead.',
  weak_password: `Choose a stronger password: at least ${MIN_PASSWORD_LENGTH} characters.`,
  email_address_invalid: 'That email address doesn’t look right.',
  validation_failed: 'Check the email and password and try again.',
  over_request_rate_limit: 'Too many tries. Wait a few minutes, then try again.',
  over_email_send_rate_limit: 'Too many emails sent. Wait a few minutes, then try again.',
  signup_disabled: 'New accounts can’t be made right now.',
  anonymous_provider_disabled: 'Guest sign-in is off right now. Make an account instead.',
  same_password: 'Your new password is the same as the old one.',
  session_expired: 'You were signed out. Sign in again.',
};

export function authErrorMessage(error: { code?: string; status?: number; message?: string }): string {
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!;
  if (error.status === 429) return MESSAGES.over_request_rate_limit!;
  log.warn('auth', `failed (${error.code ?? error.status ?? 'no code'}): ${error.message ?? ''}`);
  return 'That didn’t work. Check your connection and try again.';
}
