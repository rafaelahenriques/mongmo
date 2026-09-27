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
