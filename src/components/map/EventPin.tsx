import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { BrandPin } from '@/components/map/BrandPin';
import { useBusyStore } from '@/state/busyStore';
import { useLocationStore } from '@/state/locationStore';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { getEventPhase } from '@/utils/dateTime';
import type { PopUpEvent } from '@/types';

export type EventPinProps = {
  event: PopUpEvent;
  onPress: () => void;
};

/**
 * A pop-up on the map: just the pin, the logo's Ộ on a round colour
 * (sage, bigger and pointed when live; paper when still to come). Tap it
 * for the rest; screen readers hear the name, distance and how busy.
 */
function EventPinComponent({ event, onPress }: EventPinProps) {
  const busy = useBusyStore((state) => state.busy[event.id] ?? event.busy);
  const userCoordinates = useLocationStore((state) => state.coordinates);
  const distance = userCoordinates ? distanceInMeters(userCoordinates, event.coordinates) : null;
  const live = getEventPhase(event.startsAt, event.endsAt) === 'live';

  const label =
    `${event.title} pop-up in ${event.city}` +
    (live ? ', live now' : '') +
    `, ${busy.occupancy} of ${busy.capacity} busy` +
    (distance !== null ? `, ${formatDistance(distance)} away` : '') +
    '. Open details.';

  return (
    <Marker coordinate={event.coordinates} anchor={{ x: 0.5, y: 0.5 }} onPress={onPress}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        onAccessibilityTap={onPress}
        style={styles.pin}
      >
        <BrandPin tone={live ? 'live' : 'upcoming'} size={live ? 52 : 40} point={live} />
      </View>
    </Marker>
  );
}

export default memo(EventPinComponent);

const styles = StyleSheet.create({
  pin: {
    alignItems: 'center',
  },
});
