import NetInfo from '@react-native-community/netinfo';
import { QueryCache, QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

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

/**
 * Tell react-query when the app is in the foreground. On a phone it can't
 * tell by itself, so polling (an order's status, the owner's board) went on
 * in the background, and coming back to the app refreshed nothing. Now
 * polling pauses in the background and stale data refreshes on return. The
 * web already reports this through the page's visibility.
 */
if (Platform.OS !== 'web') {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (state) => setFocused(state === 'active'));
    return () => subscription.remove();
  });
}

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
