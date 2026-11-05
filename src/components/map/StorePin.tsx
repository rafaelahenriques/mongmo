import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { BrandPin } from '@/components/map/BrandPin';
import { useBusyStore } from '@/state/busyStore';
import { useLocationStore } from '@/state/locationStore';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { getStoreStatus } from '@/utils/dateTime';
import type { Store } from '@/types';

export type StorePinProps = {
  store: Store;
  onPress: () => void;
};


/**
 * The café on the map: the Ộ in sage on an ink disc (the pop-ups are
 * sage or paper). Tap it for the rest.
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
        <BrandPin tone="cafe" size={44} />
      </View>
    </Marker>
  );
}

export default memo(StorePinComponent);

const styles = StyleSheet.create({
  pin: {
    alignItems: 'center',
  },
});
