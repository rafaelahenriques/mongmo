import type { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Navigation, Phone, ShoppingBag, X } from 'lucide-react-native';

import CapacityMeter from '@/components/events/CapacityMeter';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
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

type ActionRowProps = {
  label: string;
  hint: string;
  icon: ReactNode;
  onPress: () => void;
};

function ActionRow({ label, hint, icon, onPress }: ActionRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${hint}`}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {icon}
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

/**
 * Shared sheet body: status, address, live capacity, weekly hours, amenities
 * and the directions/order/call actions. Rendered inside the store sheet on
 * both native and web (both are Modal-based bottom sheets).
 */
export default function StoreSheetContent({ store, busy, onClose }: StoreSheetContentProps) {
  const theme = useTheme();
  const router = useRouter();
  const status = getStoreStatus(store.hours, store.timeZone);
  const today = getCurrentWeekday(store.timeZone);

  const openDirections = (): void => {
    const { latitude, longitude } = store.coordinates;
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    ).catch(() => undefined);
  };
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
      <View style={styles.header}>
        <View style={styles.headerTexts}>
          <ThemedText type="default" style={styles.title}>
            {store.name}
          </ThemedText>
          <View style={[styles.statusChip, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText
              type="small"
              style={{
                color: status.isOpen ? theme.success : theme.textSecondary,
                fontWeight: '700',
              }}
            >
              {status.label}
            </ThemedText>
          </View>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close store details"
          hitSlop={12}
          style={styles.closeButton}
        >
          <X size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.addressRow}>
        <MapPin size={16} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.address}>
          {store.address}
        </ThemedText>
      </View>

      <CapacityMeter occupancy={busy.occupancy} capacity={busy.capacity} label="Inside now" />

      <View style={styles.section}>
        <ThemedText type="smallBold">Opening hours</ThemedText>
        {WEEKDAY_ORDER.map((weekday) => {
          const isToday = weekday === today;
          return (
            <View key={weekday} style={styles.hoursRow}>
              <ThemedText
                type="small"
                style={[styles.hoursDay, isToday && { fontWeight: '700' }]}
              >
                {WEEKDAY_LABELS[weekday]}
              </ThemedText>
              {isToday ? (
                <ThemedText type="small" style={{ color: theme.success, fontWeight: '700' }}>
                  Today
                </ThemedText>
              ) : null}
              <ThemedText
                type="small"
                themeColor={store.hours[weekday] ? 'text' : 'textSecondary'}
                style={styles.hoursValue}
              >
                {formatHoursRange(store.hours[weekday])}
              </ThemedText>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">Amenities</ThemedText>
        <View style={styles.amenities}>
          {store.amenities.map((amenity) => (
            <View
              key={amenity}
              style={[styles.amenityChip, { backgroundColor: theme.backgroundSelected }]}
            >
              <ThemedText type="small">{amenity}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <ActionRow
          label="Directions"
          hint="opens your maps app"
          icon={<Navigation size={18} color={theme.text} />}
          onPress={openDirections}
        />
        <ActionRow
          label="Order"
          hint="pickup at Mongmo café"
          icon={<ShoppingBag size={18} color={theme.text} />}
          onPress={openOrder}
        />
        <ActionRow
          label="Call"
          hint={`dials ${store.phone}`}
          icon={<Phone size={18} color={theme.text} />}
          onPress={callStore}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerTexts: {
    flexShrink: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  closeButton: {
    padding: Spacing.one,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  address: {
    flex: 1,
  },
  section: {
    gap: Spacing.two,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  hoursDay: {
    width: 96,
  },
  hoursValue: {
    marginLeft: 'auto',
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  amenityChip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
});
