import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * The single Supabase client for the app: Postgres queries, auth and
 * realtime all go through this instance. Sessions persist (AsyncStorage on
 * native) so signed-in users stay signed in across app launches.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    // Web uses supabase-js's own default instead: localStorage in the
    // browser, in-memory during Expo Router's static pre-render in Node —
    // where AsyncStorage's web shim reaches for `window` and crashes it.
    ...(Platform.OS === 'web' ? {} : { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** The signed-in user's id. Only call this where a session is guaranteed (see useSession). */
export async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new Error('Not signed in');
  }
  return data.session.user.id;
}
