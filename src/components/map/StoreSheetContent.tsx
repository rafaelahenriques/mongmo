import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import CapacityMeter from '@/components/events/CapacityMeter';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { openDirections } from '@/services/directions';
import { useCartStore } from '@/state/cartStore';
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  formatHoursRange,
  getCurrentWeekday,
  getStoreStatus,
} from '@/utils/dateTime';
import type { BusyState, Store } from '@/types';

export type StoreSheetContentProps = {
  store: Store;
  busy: BusyState;
  onClose: () => void;
};

/**
 * Store sheet body: open/closed, live "inside now", the order / directions /
 * call actions, weekly hours (today marked) and amenities.
 */
export default function StoreSheetContent({ store, busy, onClose }: StoreSheetContentProps) {
  const theme = useTheme();
  const router = useRouter();
  const status = getStoreStatus(store.hours, store.timeZone);
  const today = getCurrentWeekday(store.timeZone);

  const onDirections = (): void => openDirections(store.coordinates, store.name);
  const openOrder = (): void => {
    useCartStore.getState().setLocation({ type: 'store', storeId: store.id });
    onClose();
    router.push('/(orders)/order/menu');
  };
  const callStore = (): void => {
    Linking.openURL(`tel:${store.phone.replace(/\s+/g, '')}`).catch(() => undefined);
  };

  return (
    <View style={styles.container}>
      <Chip label={status.label} tone={status.isOpen ? 'success' : 'neutral'} icon="clock" />

      <Card tone="muted">
        <CapacityMeter occupancy={busy.occupancy} capacity={busy.capacity} label="Inside now" />
      </Card>

      <Button
        label="Order for pickup"
        accessibilityLabel="Order, pickup at Mongmo café"
        variant="brand"
        icon="bag"
        arrow
        onPress={openOrder}
      />
      <View style={styles.actions}>
        <Button
          label="Directions"
          accessibilityLabel="Directions, opens your maps app"
          variant="ghost"
          size="medium"
          icon="distance"
          onPress={onDirections}
          style={styles.flex}
        />
        <Button
          label="Call"
          accessibilityLabel={`Call, dials ${store.phone}`}
          variant="ghost"
          size="medium"
          icon="phone"
          onPress={callStore}
          style={styles.flex}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="section">Opening hours</ThemedText>
        <Card tone="muted" style={styles.hours}>
          {WEEKDAY_ORDER.map((weekday) => {
            const isToday = weekday === today;
            return (
              <View
                key={weekday}
                style={[styles.hoursRow, isToday && { backgroundColor: theme.backgroundElement }]}
              >
                <ThemedText type={isToday ? 'smallBold' : 'small'} style={styles.flex}>
                  {WEEKDAY_LABELS[weekday]}
                  {isToday ? ' · today' : ''}
                </ThemedText>
                <ThemedText
                  type={isToday ? 'smallBold' : 'small'}
                  themeColor={store.hours[weekday] ? 'text' : 'textSecondary'}
                >
                  {formatHoursRange(store.hours[weekday])}
                </ThemedText>
              </View>
            );
          })}
        </Card>
      </View>

      {store.amenities.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="section">Amenities</ThemedText>
          <View style={styles.amenities}>
            {store.amenities.map((amenity) => (
              <Chip key={amenity} label={amenity} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  section: {
    gap: Spacing.two,
  },
  hours: {
    padding: Spacing.two,
    gap: 0,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
  },
});
