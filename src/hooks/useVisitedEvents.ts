import { useQuery } from '@tanstack/react-query';

import { getVisitedEvents } from '@/api/endpoints';

/** The signed-in user's past check-ins, newest first — feeds the photo gallery. */
export function useVisitedEvents() {
  return useQuery({
    queryKey: ['visited-events'],
    queryFn: () => getVisitedEvents(),
  });
}
