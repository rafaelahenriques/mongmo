import { forwardRef, memo } from 'react';
import { StyleSheet } from 'react-native';
import RNMapView, { type Region } from 'react-native-maps';

import EventPin from '@/components/map/EventPin';
import StorePin from '@/components/map/StorePin';
import type { PopUpEvent, Store } from '@/types';

/** Imperative handle the recenter button uses to animate the camera. */
export type MapHandle = RNMapView;

export type MapViewProps = {
  initialRegion: Region;
  showsUserLocation: boolean;
  /** The permanent store (always rendered, ignores date filters). */
  store: Store | null;
  /** Currently relevant events, already date-filtered by the API. */
  events: PopUpEvent[];
  onSelectStore: () => void;
  onSelectEvent: (eventId: string) => void;
};

/**
 * Full-screen native map. Pins live here (not in the screen) so the
 * react-native-maps import never reaches the web bundle — see MapView.web.tsx.
 */
const MapView = forwardRef<MapHandle, MapViewProps>(function MapView(
  { initialRegion, showsUserLocation, store, events, onSelectEvent, onSelectStore },
  ref,
) {
  return (
    <RNMapView
      ref={ref}
      style={styles.map}
      initialRegion={initialRegion}
      showsUserLocation={showsUserLocation}
      showsCompass={false}
      accessibilityLabel="Map showing the Mongmo store and pop-up events"
    >
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
