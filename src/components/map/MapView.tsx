import { forwardRef, memo } from 'react';
import { StyleSheet } from 'react-native';
import RNMapView, { Polyline, type Region } from 'react-native-maps';

import EventPin from '@/components/map/EventPin';
import { MapFallback } from '@/components/map/MapFallback';
import StorePin from '@/components/map/StorePin';
import { Colors } from '@/constants/theme';
import { LIVE_MAP } from '@/lib/liveMap';
import type { Coordinates, PopUpEvent, Store } from '@/types';

/** Imperative handle the recenter button uses to animate the camera. */
export type MapHandle = RNMapView;

export type MapViewProps = {
  initialRegion: Region;
  showsUserLocation: boolean;
  /** The permanent store (always rendered, ignores date filters). */
  store: Store | null;
  /** Currently relevant events, already date-filtered by the API. */
  events: PopUpEvent[];
  /** A dotted line from you to the live pop-up (you first). */
  route?: [Coordinates, Coordinates];
  onSelectStore: () => void;
  onSelectEvent: (eventId: string) => void;
};

/**
 * Full-screen native map. Pins live here (not in the screen) so the
 * react-native-maps import never reaches the web bundle — see MapView.web.tsx.
 * An Android build without a Google Maps key shows the drawn stand-in.
 */
const MapView = forwardRef<MapHandle, MapViewProps>(function MapView(
  { initialRegion, showsUserLocation, store, events, route, onSelectEvent, onSelectStore },
  ref,
) {
  if (!LIVE_MAP) {
    return <MapFallback route={Boolean(route)} note="The live map isn't in this version of the app." />;
  }
  return (
    <RNMapView
      ref={ref}
      style={styles.map}
      initialRegion={initialRegion}
      showsUserLocation={showsUserLocation}
      showsCompass={false}
      showsPointsOfInterests={false}
      accessibilityLabel="Map showing the Mongmo café and pop-ups"
    >
      {route ? (
        <Polyline
          coordinates={route}
          strokeColor={Colors.light.brandFill}
          strokeWidth={5}
          lineCap="round"
          lineDashPattern={[1, 10]}
        />
      ) : null}
      {store ? <StorePin store={store} onPress={onSelectStore} /> : null}
      {events.map((event) => (
        <EventPin key={event.id} event={event} onPress={() => onSelectEvent(event.id)} />
      ))}
    </RNMapView>
  );
});

export default memo(MapView);

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
