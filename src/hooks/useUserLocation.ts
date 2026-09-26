import { useEffect } from 'react';

import * as Location from 'expo-location';

import { useLocationStore } from '@/state/locationStore';

/**
 * Requests foreground location once on mount and watches the device position
 * into `locationStore`. Everything else (map pins, distances, geofencing)
 * reads that store, so the permission/watcher lives in exactly one place.
 */
export function useUserLocation(): void {
  const setPermission = useLocationStore((state) => state.setPermission);
  const setCoordinates = useLocationStore((state) => state.setCoordinates);

  useEffect(() => {
    let mounted = true;
    let subscription: { remove: () => void } | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;

      if (status !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
        (position) => {
          if (!mounted) return;
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
      );
    })().catch(() => {
      // Permission dialogs failing (simulator quirks, etc.) must never break
      // the map: pins still render, just without distance/notifications.
      if (mounted) setPermission('denied');
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [setPermission, setCoordinates]);
}
