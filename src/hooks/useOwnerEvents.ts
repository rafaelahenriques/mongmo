import { useQuery } from '@tanstack/react-query';

import { getOwnerEvents } from '@/api/owner';

/** Every event regardless of status — the owner's event list. */
export function useOwnerEvents() {
  return useQuery({
    queryKey: ['owner', 'events'],
    queryFn: () => getOwnerEvents(),
  });
}
