import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { queryClient } from '@/api/queryClient';
import { supabase } from '@/lib/supabase';

/**
 * The signed-in Supabase session, kept live via onAuthStateChange. Gates the
 * whole app in Providers: `session === undefined` is "still checking",
 * `null` is "signed out", anything else is a signed-in user.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) void dropIfAccountGone();
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Drop any cached queries from the previous session (profile,
      // achievements, orders…) so a new sign-in never flashes stale data.
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return session;
}

/**
 * A stored session can outlive its account (deleted on another phone, or by
 * hand in the dashboard): every write would then fail. Ask the server once
 * at start, and sign out locally if the account is gone. Network errors
 * leave the session alone, so the app still opens offline.
 */
async function dropIfAccountGone() {
  const { error } = await supabase.auth.getUser();
  if (!error) return;
  const gone = error.code === 'user_not_found' || error.code === 'session_not_found' || error.status === 403;
  if (gone) await supabase.auth.signOut({ scope: 'local' });
}
