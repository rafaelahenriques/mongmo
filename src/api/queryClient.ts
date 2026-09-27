import NetInfo from '@react-native-community/netinfo';
import { QueryClient, onlineManager } from '@tanstack/react-query';

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
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
});
