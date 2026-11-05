import NetInfo from '@react-native-community/netinfo';
import { QueryCache, QueryClient, onlineManager } from '@tanstack/react-query';

import { log } from '@/lib/log';

/**
 * Drive react-query's online state from NetInfo. While offline, fetches pause
 * (networkMode "online") so the persisted last-known data keeps rendering and
 * everything refetches automatically when connectivity returns.
 */
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    const online = state.isConnected !== false && state.isInternetReachable !== false;
    setOnline(online);
  }),
);

export const queryClient = new QueryClient({
  // Screens only say "Couldn't load …"; the log says *why* (a missing
  // grant, an empty table, an expired session…), once per query after its
  // retries are exhausted, and a crash report carries it as a breadcrumb.
  queryCache: new QueryCache({
    onError: (error, query) => log.warn('query', `${JSON.stringify(query.queryKey)} failed: ${error.message}`),
  }),
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
});
