import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getEvent } from '@/api/endpoints';
import { ApiError } from '@/api/errors';
import { useBusyStore } from '@/state/busyStore';

/** A single event for the detail screen (also reachable via push deep link). */
export function useEvent(id: string) {
  const query = useQuery({
    queryKey: ['event', id],
    queryFn: ({ signal }) => getEvent(id, signal),
    enabled: id.length > 0,
    staleTime: 60_000,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) && failureCount < 2,
  });

  useEffect(() => {
    if (query.data) useBusyStore.getState().seed(query.data);
  }, [query.data]);

  return query;
}
