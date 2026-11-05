import { toApiError } from '@/api/errors';
import { supabase } from '@/lib/supabase';
import { authErrorMessage } from '@/services/authMessages';
import { confirm, showError } from '@/services/confirm';

/**
 * Asks before signing out. Signing out ends the Supabase session, which
 * useSession picks up to swap the tabs for the sign-in screen (and clear the
 * query cache).
 */
export async function confirmLogOut(): Promise<void> {
  const yes = await confirm(
    'Log out?',
    'You can sign back in any time — your points and badges are saved.',
    'Log out',
    { destructive: true },
  );
  if (yes) await supabase.auth.signOut();
}

/**
 * Asks first, then deletes the account on the server (orders,
 * points, badges, photos records) and signs out.
 */
export async function confirmDeleteAccount(): Promise<void> {
  const yes = await confirm(
    'Delete your account?',
    'Your points, badges, rewards, photos and order history go for good. This can’t be undone.',
    'Delete',
    { destructive: true },
  );
  if (!yes) return;
  try {
    await deleteMyPhotos();
  } catch (error) {
    showError('Couldn’t delete your photos', error);
    return;
  }
  const { error } = await supabase.rpc('delete_my_account');
  if (error) {
    showError('Couldn’t delete your account', toApiError(error));
    return;
  }
  await supabase.auth.signOut();
}

/**
 * Removes every photo file the user uploaded (challenge-photos/<their id>/),
 * a page at a time, through the Storage API so the files themselves go.
 * delete_my_account() won't run while any are left (0020).
 */
async function deleteMyPhotos(): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;
  const bucket = supabase.storage.from('challenge-photos');
  for (;;) {
    const { data: files, error } = await bucket.list(userId, { limit: 100 });
    if (error) throw error;
    if (!files?.length) return;
    const { error: removeError } = await bucket.remove(files.map((file) => `${userId}/${file.name}`));
    if (removeError) throw removeError;
  }
}

/**
 * Changes the password after checking the current one (signing in with it
 * again), so a phone left unlocked can't be used to take over the account.
 * Resolves to a message to show, or null when it worked.
 */
export async function changePassword(current: string, next: string): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return 'A guest account has no password. Create an account to set one.';

  const check = await supabase.auth.signInWithPassword({ email, password: current });
  if (check.error) {
    // 400 is a wrong password; anything else (too many tries, offline) says what it is.
    const wrong = check.error.code === 'invalid_credentials' || check.error.status === 400;
    return wrong ? 'That isn’t your current password.' : authErrorMessage(check.error);
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (!error) return null;
  return authErrorMessage(error);
}
