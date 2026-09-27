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
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

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
