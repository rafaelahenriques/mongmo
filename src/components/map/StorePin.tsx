import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { CardShadow, Colors } from '@/constants/theme';
import { useBusyStore } from '@/state/busyStore';
import { useLocationStore } from '@/state/locationStore';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { getStoreStatus } from '@/utils/dateTime';
import type { Store } from '@/types';

export type StorePinProps = {
  store: Store;
  onPress: () => void;
};

/** Pins sit on the map, not on a themed surface: always the light palette. */
const INK = Colors.light.text;
const PAPER = Colors.light.background;

/**
 * The café on the map: a dark square with the shop symbol (square, because
 * it is a fixed place, not a pop-up) and its name.
 */
function StorePinComponent({ store, onPress }: StorePinProps) {
  const busy = useBusyStore((state) => state.busy[store.id] ?? store.busy);
  const userCoordinates = useLocationStore((state) => state.coordinates);
  const status = useMemo(() => getStoreStatus(store.hours, store.timeZone), [store.hours, store.timeZone]);
  const distance = userCoordinates ? distanceInMeters(userCoordinates, store.coordinates) : null;

  const label =
    `${store.name} café, ${status.label}, ${busy.occupancy} of ${busy.capacity} inside` +
    (distance !== null ? `, ${formatDistance(distance)} away` : '');

  return (
    <Marker coordinate={store.coordinates} anchor={{ x: 0.5, y: 0.5 }} onPress={onPress}>
      <View accessible accessibilityRole="button" accessibilityLabel={label} onAccessibilityTap={onPress} style={styles.pin}>
        <View style={[styles.square, { backgroundColor: status.isOpen ? INK : Colors.light.textSecondary }]}>
          <Icon name="store" size={16} color={PAPER} />
        </View>
        <View style={[styles.label, { backgroundColor: Colors.light.backgroundElement, boxShadow: CardShadow }]}>
          <ThemedText type="captionBold" numberOfLines={1} style={{ color: INK }}>
            {store.name}
          </ThemedText>
        </View>
      </View>
    </Marker>
  );
}

export default memo(StorePinComponent);

const styles = StyleSheet.create({
  pin: {
    alignItems: 'center',
    gap: 4,
    maxWidth: 200,
  },
  square: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});
