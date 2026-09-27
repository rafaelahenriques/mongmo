import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import Chip from '@/components/ui/Chip';
import { ThemedText } from '@/components/ThemedText';
import { useBusyStore } from '@/state/busyStore';
import { useLocationStore } from '@/state/locationStore';
import { useTheme } from '@/hooks/useTheme';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { getEventPhase } from '@/utils/dateTime';
import type { PopUpEvent } from '@/types';

export type EventPinProps = {
  event: PopUpEvent;
  onPress: () => void;
};

/** Required pin color for pop-ups (design brief). */
const EVENT_RED = '#FF6B6B';

/**
 * Pin for a temporary pop-up: red dot + pill with distance and the live
 * occupancy, marked FULL when the event is at capacity.
 */
function EventPinComponent({ event, onPress }: EventPinProps) {
  const theme = useTheme();
  const busy = useBusyStore((state) => state.busy[event.id] ?? event.busy);
  const userCoordinates = useLocationStore((state) => state.coordinates);

  const distance = userCoordinates
    ? distanceInMeters(userCoordinates, event.coordinates)
    : null;
  const isFull = busy.occupancy >= busy.capacity;
  const phase = getEventPhase(event.startsAt, event.endsAt);

  const subline = [
    distance !== null ? formatDistance(distance) : null,
    isFull ? 'FULL' : `${busy.occupancy}/${busy.capacity} busy`,
  ]
    .filter(Boolean)
    .join(' · ');

  const label =
    `${event.title} pop-up in ${event.city}` +
    (phase === 'live' ? ', live now' : '') +
    `, ${busy.occupancy} of ${busy.capacity} busy${isFull ? ', full' : ''}` +
    (distance !== null ? `, ${formatDistance(distance)} away` : '') +
    '. Open details.';

  return (
    <Marker coordinate={event.coordinates} anchor={{ x: 0.5, y: 1 }} onPress={onPress}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        onAccessibilityTap={onPress}
        style={[
          styles.pill,
          { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: EVENT_RED }]} />
        <View style={styles.texts}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {event.title}
          </ThemedText>
          <ThemedText
            type="small"
            numberOfLines={1}
            style={isFull ? { color: theme.danger, fontWeight: '700' } : { color: theme.textSecondary }}
          >
            {subline}
          </ThemedText>
        </View>
        {isFull ? <Chip label="FULL" tone="danger" /> : null}
      </View>
    </Marker>
  );
}

export default memo(EventPinComponent);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    maxWidth: 240,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  texts: {
    flexShrink: 1,
  },
});
