import { useCallback, useMemo, useRef } from 'react';
import type { Region } from 'react-native-maps';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import MapView, { type MapHandle } from '@/components/map/MapView';
import RecenterButton from '@/components/map/RecenterButton';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useLocationStore } from '@/state/locationStore';
import type { Coordinates, EventFilter, PopUpEvent, Store } from '@/types';

const EMPTY_FILTER_COPY: Record<EventFilter, string> = {
  today: 'No pop-ups today.',
  week: 'No pop-ups this week.',
  all: 'No upcoming pop-ups.',
};

const KORTRIJK_CENTER: Coordinates = { latitude: 50.8276, longitude: 3.2662 };

/** Fit the camera around the store + visible events (or Kortrijk if empty). */
function computeInitialRegion(store: Store | null, events: PopUpEvent[]): Region {
  const points: Coordinates[] = [
    ...events.map((event) => event.coordinates),
    ...(store ? [store.coordinates] : []),
  ];

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
  filter: EventFilter;
  eventsEmpty: boolean;
  eventsError: boolean;
  onSelectStore: () => void;
  onSelectEvent: (eventId: string) => void;
};

/** Full-screen native map: store pin, event pins, user location dot, recenter. */
export default function MapMode({
  store,
  storeLoading,
  storeLoadError,
  onRetryStore,
  events,
  filter,
  eventsEmpty,
  eventsError,
  onSelectStore,
  onSelectEvent,
}: MapModeProps) {
  const theme = useTheme();
  const permission = useLocationStore((state) => state.permission);
  const userCoordinates = useLocationStore((state) => state.coordinates);
  const mapRef = useRef<MapHandle>(null);

  const initialRegion = useMemo(() => computeInitialRegion(store, events), [store, events]);

  const onRecenter = useCallback(() => {
    if (!userCoordinates) return;
    mapRef.current?.animateToRegion(
      {
        latitude: userCoordinates.latitude,
        longitude: userCoordinates.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      600,
    );
  }, [userCoordinates]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        initialRegion={initialRegion}
        showsUserLocation={permission === 'granted'}
        store={store}
        events={events}
        onSelectStore={onSelectStore}
        onSelectEvent={onSelectEvent}
      />

      {storeLoading || storeLoadError ? (
        <View style={styles.centerWrap} pointerEvents="box-none">
          <View style={[styles.centerCard, { backgroundColor: theme.backgroundElement }]}>
            {storeLoading ? (
              <>
                <ActivityIndicator size="small" color={theme.text} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                  Loading map data…
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText type="smallBold" style={styles.centerTitle}>
                  Couldn&apos;t load the store
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                  Check your connection and try again.
                </ThemedText>
                <Pressable
                  onPress={onRetryStore}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading store data"
                  style={({ pressed }) => [
                    styles.retryButton,
                    { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <ThemedText type="smallBold">Retry</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      ) : null}

      {store && eventsEmpty && !eventsError ? (
        <View style={styles.emptyWrap} pointerEvents="none">
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
            ]}
            accessibilityRole="text"
            accessibilityLabel={`${EMPTY_FILTER_COPY[filter]} Tap the Mongmo store pin for hours, capacity and directions.`}
          >
            <ThemedText type="smallBold" style={styles.centerTitle}>
              {EMPTY_FILTER_COPY[filter]}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
              Tap the Mongmo store pin for hours, capacity and directions.
            </ThemedText>
          </View>
        </View>
      ) : null}

      <View style={styles.recenterWrap}>
        <RecenterButton
          enabled={permission === 'granted' && userCoordinates !== null}
          onPress={onRecenter}
        />
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
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
    maxWidth: 320,
  },
  centerTitle: {
    textAlign: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  emptyWrap: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: 88,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  recenterWrap: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
  },
});
