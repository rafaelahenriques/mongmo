import { useCallback, useMemo, useRef } from 'react';
import type { Region } from 'react-native-maps';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import MapView, { type MapHandle } from '@/components/map/MapView';
import RecenterButton from '@/components/map/RecenterButton';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useLocationStore } from '@/state/locationStore';
import type { Coordinates, PopUpEvent, Store } from '@/types';
import { useMotion } from '@/constants/motion';

const KORTRIJK_CENTER: Coordinates = { latitude: 50.8276, longitude: 3.2662 };

/** Fit the camera around the store + visible events (or Kortrijk if empty). */
function computeInitialRegion(store: Store | null, events: PopUpEvent[]): Region {
  const points: Coordinates[] = [...events.map((event) => event.coordinates), ...(store ? [store.coordinates] : [])];

  if (points.length === 0) {
    return {
      latitude: KORTRIJK_CENTER.latitude,
      longitude: KORTRIJK_CENTER.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.min(Math.max((maxLatitude - minLatitude) * 1.7, 0.05), 2),
    longitudeDelta: Math.min(Math.max((maxLongitude - minLongitude) * 1.7, 0.05), 2),
  };
}

export type MapModeProps = {
  store: Store | null;
  storeLoading: boolean;
  storeLoadError: boolean;
  onRetryStore: () => void;
  events: PopUpEvent[];
  /** The live pop-up the panel features: the map draws the way there. */
  live?: PopUpEvent;
  onSelectStore: () => void;
  onSelectEvent: (eventId: string) => void;
};

/** The map: café and pop-up pins, your position, the way to the live one, recenter. */
export default function MapMode({
  store,
  storeLoading,
  storeLoadError,
  onRetryStore,
  events,
  live,
  onSelectStore,
  onSelectEvent,
}: MapModeProps) {
  const theme = useTheme();
  const motion = useMotion();
  const permission = useLocationStore((state) => state.permission);
  const userCoordinates = useLocationStore((state) => state.coordinates);
  const mapRef = useRef<MapHandle>(null);

  const initialRegion = useMemo(() => computeInitialRegion(store, events), [store, events]);
  const route = useMemo<[Coordinates, Coordinates] | undefined>(
    () => (live && userCoordinates ? [userCoordinates, live.coordinates] : undefined),
    [live, userCoordinates],
  );

  const onRecenter = useCallback(() => {
    if (!userCoordinates) return;
    mapRef.current?.animateToRegion(
      {
        latitude: userCoordinates.latitude,
        longitude: userCoordinates.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      motion.mapMoveMs,
    );
  }, [userCoordinates, motion.mapMoveMs]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        initialRegion={initialRegion}
        showsUserLocation={permission === 'granted'}
        store={store}
        events={events}
        route={route}
        onSelectStore={onSelectStore}
        onSelectEvent={onSelectEvent}
      />

      {storeLoading || storeLoadError ? (
        <View style={styles.centerWrap} pointerEvents="box-none">
          <Card style={styles.centerCard}>
            {storeLoading ? (
              <>
                <ActivityIndicator size="small" color={theme.text} />
                <ThemedText type="caption" themeColor="textSecondary" style={styles.centerText}>
                  Loading the map…
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText type="smallBold" style={styles.centerText}>
                  Couldn&apos;t load the café
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.centerText}>
                  Check your connection and try again.
                </ThemedText>
                <Button
                  label="Retry"
                  accessibilityLabel="Retry loading the café"
                  size="medium"
                  onPress={onRetryStore}
                />
              </>
            )}
          </Card>
        </View>
      ) : null}

      <View style={styles.recenterWrap}>
        <RecenterButton enabled={permission === 'granted' && userCoordinates !== null} onPress={onRecenter} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  centerCard: {
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
    maxWidth: 320,
  },
  centerText: {
    textAlign: 'center',
  },
  recenterWrap: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
  },
});
