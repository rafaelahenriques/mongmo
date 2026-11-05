import { supabase } from '@/lib/supabase';

/**
 * Two-step sign-in, ready to switch on. Supabase supports authenticator-app
 * codes (TOTP) per account; this wraps its API so the screens stay simple.
 * Not shown in the app yet: turn on MFA in Supabase (Auth → Multi-factor),
 * then add a Settings screen that calls enrollAuthenticator and
 * confirmEnrollment, and a code step after sign-in when needsSecondStep()
 * says so. Passkeys will slot in as another factor type here when Supabase
 * offers them.
 */

export type SecondFactor = { id: string; type: 'totp'; name: string | null; verified: boolean };

/** The account's second factors (authenticator apps). */
export async function listSecondFactors(): Promise<SecondFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data.totp.map((factor) => ({
    id: factor.id,
    type: 'totp' as const,
    name: factor.friendly_name ?? null,
    verified: factor.status === 'verified',
  }));
}

/**
 * Starts adding an authenticator app: returns the QR code (an SVG) to scan
 * and the secret to type in by hand. Confirm with a code from the app.
 */
export async function enrollAuthenticator(name = 'Authenticator app') {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: name });
  if (error) throw error;
  return { factorId: data.id, qrCodeSvg: data.totp.qr_code, secret: data.totp.secret };
}

/** Checks a 6-digit code against a factor: confirms a new one, or completes sign-in. */
export async function verifyCode(factorId: string, code: string): Promise<boolean> {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) throw challengeError;
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.trim() });
  return !error;
}

/** Whether this sign-in still needs a code: the account has a second factor that wasn't used yet. */
export async function needsSecondStep(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data.currentLevel === 'aal1' && data.nextLevel === 'aal2';
}

/** Removes a second factor (needs a recent two-step sign-in). */
export async function removeSecondFactor(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
