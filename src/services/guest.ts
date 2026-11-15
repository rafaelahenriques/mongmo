import { supabase } from '@/lib/supabase';

export type AuthMode = 'sign-in' | 'sign-up';

/** How the Welcome screen opens next: set when a guest asks to sign in or make an account. */
let nextMode: AuthMode | null = null;

/**
 * A guest leaving guest mode to sign in or make an account: the guest
 * session ends and Welcome opens on the form they asked for. A guest has
 * nothing kept to lose (they can't order, check in or earn points), and
 * the empty guest account is deleted with the others after 30 days
 * unused (0025_retention.sql).
 */
export async function startAccount(mode: AuthMode): Promise<void> {
  nextMode = mode;
  await supabase.auth.signOut();
}

/** The form a guest just asked for, which Welcome opens on; none: Welcome starts at the landing. */
export function welcomeMode(): AuthMode | null {
  return nextMode;
}

/** Once Welcome has opened on it, later visits start from sign in again. */
export function clearWelcomeMode(): void {
  nextMode = null;
}
