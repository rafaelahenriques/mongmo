import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type OrderRow = Database['public']['Tables']['orders']['Row'];

/** The signed-in user's most recent order that hasn't been collected/cancelled. */
export function useActiveOrder() {
  return useQuery({
    queryKey: ['active-order'],
    queryFn: async (): Promise<OrderRow | null> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('status', 'in', '(collected,cancelled)')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
