import { Alert, Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

const TITLE = 'Log out?';
const MESSAGE = 'You can sign back in any time — your points and badges are saved.';

/**
 * Asks before signing out. Signing out ends the Supabase session, which
 * useSession picks up to swap the tabs for the sign-in screen (and clear the
 * query cache).
 */
export function confirmLogOut() {
  // react-native-web's Alert.alert is a no-op, so on web the button would
  // silently do nothing.
  if (Platform.OS === 'web') {
    if (window.confirm(`${TITLE}\n\n${MESSAGE}`)) void supabase.auth.signOut();
    return;
  }

  Alert.alert(TITLE, MESSAGE, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log out', style: 'destructive', onPress: () => supabase.auth.signOut() },
  ]);
}

/**
 * Asks first, then deletes the account on the server (orders,
 * points, badges, photos records) and signs out.
 */
export async function confirmDeleteAccount(): Promise<void> {
  const title = 'Delete your account?';
  const message = 'Your points, badges, rewards and order history go for good. This can’t be undone.';
  const yes =
    Platform.OS === 'web'
      ? window.confirm(`${title}\n\n${message}`)
      : await new Promise<boolean>((resolve) =>
          Alert.alert(title, message, [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ]),
        );
  if (!yes) return;
  const { error } = await supabase.rpc('delete_my_account');
  if (error) {
    Alert.alert('Couldn’t delete your account', error.message);
    return;
  }
  await supabase.auth.signOut();
}
