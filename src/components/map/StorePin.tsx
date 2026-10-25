import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { Colors, Paper, Radius } from '@/constants/theme';
import { useBusyStore } from '@/state/busyStore';
import { useLocationStore } from '@/state/locationStore';
import { useTheme } from '@/hooks/useTheme';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { getStoreStatus } from '@/utils/dateTime';
import type { Store } from '@/types';

export type StorePinProps = {
  store: Store;
  onPress: () => void;
};

/** Map pins keep the light palette in both schemes — they sit on the map, not on a themed surface. */
const STORE_OPEN = Colors.light.primary;
const STORE_CLOSED = Colors.light.textSecondary;

/**
 * Pin for the single permanent store: brown while open, greyed when closed,
 * with a live pill showing distance and how many people are inside.
 */
function StorePinComponent({ store, onPress }: StorePinProps) {
  const theme = useTheme();
  const busy = useBusyStore((state) => state.busy[store.id] ?? store.busy);
  const userCoordinates = useLocationStore((state) => state.coordinates);

  const status = useMemo(
    () => getStoreStatus(store.hours, store.timeZone),
    [store.hours, store.timeZone],
  );

  const distance = userCoordinates
    ? distanceInMeters(userCoordinates, store.coordinates)
    : null;

  const subline = [
    distance !== null ? formatDistance(distance) : null,
    `${busy.occupancy}/${busy.capacity} inside`,
    status.isOpen ? null : 'Closed',
  ]
    .filter(Boolean)
    .join(' · ');

  const label =
    `${store.name} store, ${status.label}, ${busy.occupancy} of ${busy.capacity} inside` +
    (distance !== null ? `, ${formatDistance(distance)} away` : '');

  return (
    <Marker coordinate={store.coordinates} anchor={{ x: 0.5, y: 1 }} onPress={onPress}>
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
        <View
          style={[
            styles.dot,
            { backgroundColor: status.isOpen ? STORE_OPEN : STORE_CLOSED },
          ]}
        >
          <Icon name="store" size={14} color={Paper} />
        </View>
        <View style={styles.texts}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {store.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {subline}
          </ThemedText>
        </View>
      </View>
    </Marker>
  );
}

export default memo(StorePinComponent);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.pill,
    paddingLeft: 5,
    paddingRight: 14,
    paddingVertical: 5,
    maxWidth: 220,
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
