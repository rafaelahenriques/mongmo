import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getEvents } from '@/api/endpoints';
import { useBusyStore } from '@/state/busyStore';
import type { EventFilter } from '@/types';

/**
 * Pop-up events for a date filter. Server-side filtering already compares
 * each event's start time against "now" in the event's timezone; the query
 * key caches each filter separately.
 */
export function useEvents(filter: EventFilter) {
  const query = useQuery({
    queryKey: ['events', filter],
    queryFn: ({ signal }) => getEvents(filter, signal),
  });

  useEffect(() => {
    if (query.data) useBusyStore.getState().seed(query.data);
  }, [query.data]);

  return query;
}
