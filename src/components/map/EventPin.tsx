import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { Icon } from '@/components/ui/Icon';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Radius } from '@/constants/theme';
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

/** Sage with an ink symbol in both schemes — pins sit on the map, not on a themed surface. */
const EVENT_FILL = Colors.light.brandFill;
const EVENT_SYMBOL = Colors.light.onBrand;

/**
 * Pin for a temporary pop-up: sage dot + pill with distance and the live
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
          { backgroundColor: theme.backgroundElement, boxShadow: `0px 6px 16px rgba(46, 47, 42, 0.18)` },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: EVENT_FILL }]}>
          <Icon name={phase === 'live' ? 'flame' : 'food'} size={14} color={EVENT_SYMBOL} />
        </View>
        <View style={styles.texts}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {event.title}
          </ThemedText>
          <ThemedText type={isFull ? 'smallBold' : 'small'} numberOfLines={1} themeColor={isFull ? 'danger' : 'textSecondary'}>
            {subline}
          </ThemedText>
        </View>
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
    borderRadius: Radius.pill,
    paddingLeft: 5,
    paddingRight: 14,
    paddingVertical: 5,
    maxWidth: 240,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flexShrink: 1,
  },
});
