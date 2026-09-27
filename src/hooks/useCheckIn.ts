import { useQuery } from '@tanstack/react-query';

import { getCurrentUserId, supabase } from '@/lib/supabase';

/** Whether the signed-in user already has a verified check-in for this event. */
export function useCheckIn(eventId: string) {
  return useQuery({
    queryKey: ['check-in', eventId],
    queryFn: async () => {
      // Scoped explicitly: RLS also lets an owner read every customer's check-ins.
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('check_ins')
        .select('checked_in_at')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: eventId.length > 0,
  });
}
