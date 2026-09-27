import NetInfo from '@react-native-community/netinfo';
import { QueryCache, QueryClient, onlineManager } from '@tanstack/react-query';

/**
 * Drive react-query's online state from NetInfo. While offline, fetches pause
 * (networkMode "online") so the persisted last-known data keeps rendering and
 * everything refetches automatically when connectivity returns.
 */
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    const online =
      state.isConnected !== false && state.isInternetReachable !== false;
    setOnline(online);
  }),
);

export const queryClient = new QueryClient({
  // Screens only say "Couldn't load …"; in development, also print *why*
  // (a missing grant, an empty table, an expired session…) to the Metro
  // log, once per query after its retries are exhausted.
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (__DEV__) {
        console.warn(`Query ${JSON.stringify(query.queryKey)} failed: ${error.message}`);
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
});
