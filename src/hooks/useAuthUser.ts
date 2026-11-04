import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/** The signed-in account: the email it signs in with (none for a guest). */
export function useAuthUser() {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { email: data.user?.email ?? null, isGuest: data.user?.is_anonymous ?? false };
    },
  });
}
