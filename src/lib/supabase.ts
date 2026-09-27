import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

// Trimmed defensively: a stray trailing newline or copy-pasted quotes around
// the value in .env is a common way to end up with a non-empty but invalid
// URL, which otherwise surfaces as supabase-js's generic "Invalid supabaseUrl"
// with no hint of *why* the value it read was invalid.
function readEnvVar(name: string): string {
  return (process.env[name] ?? '').trim().replace(/^['"]|['"]$/g, '');
}

const SUPABASE_URL = readEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = readEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to ' +
      '.env, point it at a project with the migrations in supabase/migrations applied, and ' +
      'restart the dev server (env changes need `npx expo start -c` to take effect).',
  );
}

if (!/^https?:\/\//i.test(SUPABASE_URL)) {
  throw new Error(
    `EXPO_PUBLIC_SUPABASE_URL is set to "${SUPABASE_URL}", which isn't a full http(s) URL. ` +
      'Use the Project URL from Supabase dashboard → Project Settings → API ' +
      '(e.g. https://abcdefghij.supabase.co), not just the project ref, ' +
      'then restart the dev server with `npx expo start -c`.',
  );
}

/**
 * The single Supabase client for the app: Postgres queries, auth and
 * realtime all go through this instance. Sessions persist to AsyncStorage
 * so signed-in users stay signed in across app launches.
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
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
