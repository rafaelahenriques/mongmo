import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export type NetworkStatus = {
  isOffline: boolean;
};

/** Tracks connectivity for the offline banner. */
export function useNetworkStatus(): NetworkStatus {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setIsOffline(
          state.isConnected === false || state.isInternetReachable === false,
        );
      }),
    [],
  );

  return { isOffline };
}
