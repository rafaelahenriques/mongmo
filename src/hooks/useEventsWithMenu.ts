import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * Ids of every event that currently has a menu attached (event_menus).
 * A plain array, not a Set: the query cache is persisted as JSON, where a
 * Set silently comes back as `{}` on the next launch.
 */
export function useEventsWithMenu() {
  return useQuery({
    queryKey: ['events-with-menu'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('event_menus').select('event_id');
      if (error) throw error;
      return data.map((row) => row.event_id);
    },
  });
}
