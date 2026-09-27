import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Asks before signing out. Signing out ends the Supabase session, which
 * useSession picks up to swap the tabs for the sign-in screen (and clear the
 * query cache).
 */
export function confirmLogOut() {
  Alert.alert('Log out?', 'You can sign back in any time — your points and badges are saved.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log out', style: 'destructive', onPress: () => supabase.auth.signOut() },
  ]);
}
