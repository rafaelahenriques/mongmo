import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getStore } from '@/api/endpoints';
import { useBusyStore } from '@/state/busyStore';

/** The permanent Mongmo store, fetched once and kept fresh by react-query. */
export function useStore() {
  const query = useQuery({
    queryKey: ['store'],
    queryFn: () => getStore(),
  });

  // Seed the live-busy overlay whenever fresh API data lands.
  useEffect(() => {
    if (query.data) useBusyStore.getState().seed(query.data);
  }, [query.data]);

  return query;
}
