import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { OMark } from '@/components/brand/OMark';
import { ThemedText } from '@/components/ThemedText';
import { CardShadow, Colors } from '@/constants/theme';
import { useBusyStore } from '@/state/busyStore';
import { useLocationStore } from '@/state/locationStore';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { getEventPhase } from '@/utils/dateTime';
import type { PopUpEvent } from '@/types';

export type EventPinProps = {
  event: PopUpEvent;
  onPress: () => void;
};

/** Pins sit on the map, not on a themed surface: always the light palette. */
const PIN = Colors.light.text;
const LIVE_PIN = Colors.light.brandFill;
const LABEL_BG = Colors.light.backgroundElement;

/**
 * A pop-up on the map: the logo's Ộ as the pin (sage and bigger when live)
 * over a small square label with its name.
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
        <OMark height={live ? 50 : 36} color={live ? LIVE_PIN : PIN} />
        <View style={[styles.label, { backgroundColor: LABEL_BG, boxShadow: CardShadow }]}>
          <ThemedText type="captionBold" numberOfLines={1} style={{ color: Colors.light.text }}>
            {live ? `${event.title} · Live` : event.title}
          </ThemedText>
        </View>
      </View>
    </Marker>
  );
}

export default memo(EventPinComponent);

const styles = StyleSheet.create({
  pin: {
    alignItems: 'center',
    gap: 4,
    maxWidth: 220,
  },
  label: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});
