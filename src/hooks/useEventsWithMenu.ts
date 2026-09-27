import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/** Ids of every event that currently has a menu attached (event_menus). */
export function useEventsWithMenu() {
  return useQuery({
    queryKey: ['events-with-menu'],
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase.from('event_menus').select('event_id');
      if (error) throw error;
      return new Set(data.map((row) => row.event_id));
    },
  });
}
