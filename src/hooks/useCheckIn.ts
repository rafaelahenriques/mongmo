import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/** Whether the signed-in user already has a verified check-in for this event. */
export function useCheckIn(eventId: string) {
  return useQuery({
    queryKey: ['check-in', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('checked_in_at')
        .eq('event_id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: eventId.length > 0,
  });
}
