import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ButtonRow } from '@/components/ui/ButtonRow';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { openDirections } from '@/services/directions';
import { switchPickup } from '@/services/switchPickup';
import { WEEKDAY_LABELS, WEEKDAY_ORDER, formatHoursRange, getCurrentWeekday, getStoreStatus } from '@/utils/dateTime';
import type { Store } from '@/types';

export type StoreSheetContentProps = {
  store: Store;
  onClose: () => void;
};

/**
 * Store sheet body: open/closed, the order / directions / call actions,
 * weekly hours (today marked) and amenities. No "inside now": nothing
 * counts people at the café (pop-ups count check-ins).
 */
export default function StoreSheetContent({ store, onClose }: StoreSheetContentProps) {
  const theme = useTheme();
  const router = useRouter();
  const status = getStoreStatus(store.hours, store.timeZone);
  const today = getCurrentWeekday(store.timeZone);

  const onDirections = (): void => openDirections(store.coordinates, store.name);
  const openOrder = async (): Promise<void> => {
    if (!(await switchPickup({ type: 'store', storeId: store.id }))) return;
    onClose();
    router.navigate('/(orders)');
  };
  const callStore = (): void => {
    Linking.openURL(`tel:${store.phone.replace(/\s+/g, '')}`).catch(() => undefined);
  };

  return (
    <View style={styles.container}>
      <Chip label={status.label} tone={status.isOpen ? 'success' : 'neutral'} icon="clock" />

      <Button
        label="Order for pickup"
        accessibilityLabel="Order, pickup at Mongmo café"
        variant="brand"
        icon="bag"
        arrow
        onPress={openOrder}
      />
      <ButtonRow>
        <Button
          label="Directions"
          accessibilityLabel="Directions, opens your maps app"
          variant="ghost"
          size="medium"
          icon="distance"
          onPress={onDirections}
        />
        <Button
          label="Call"
          accessibilityLabel={`Call, dials ${store.phone}`}
          variant="ghost"
          size="medium"
          icon="phone"
          onPress={callStore}
        />
      </ButtonRow>

      <View style={styles.section}>
        <ThemedText type="section">Opening hours</ThemedText>
        <Card tone="muted" style={styles.hours}>
          {WEEKDAY_ORDER.map((weekday) => {
            const isToday = weekday === today;
            return (
              <View key={weekday} style={[styles.hoursRow, isToday && { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type={isToday ? 'captionBold' : 'caption'} style={styles.flex}>
                  {WEEKDAY_LABELS[weekday]}
                  {isToday ? ' · today' : ''}
                </ThemedText>
                <ThemedText
                  type={isToday ? 'captionBold' : 'caption'}
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
