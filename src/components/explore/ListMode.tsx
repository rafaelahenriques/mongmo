import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View, type ListRenderItem } from 'react-native';
import { MapPin } from 'lucide-react-native';

import CapacityMeter from '@/components/events/CapacityMeter';
import EventCard from '@/components/events/EventCard';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useLocationStore } from '@/state/locationStore';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { getStoreStatus } from '@/utils/dateTime';
import type { EventFilter, PopUpEvent, Store } from '@/types';

const EMPTY_FILTER_COPY: Record<EventFilter, string> = {
  today: 'No pop-ups today.',
  week: 'No pop-ups this week.',
  all: 'No upcoming pop-ups.',
};

export type ListModeProps = {
  store: Store | null;
  events: PopUpEvent[];
  filter: EventFilter;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectStore: () => void;
  onSelectEvent: (eventId: string) => void;
};

/** The store's row atop the list — always visible, never date-filtered. */
function StoreRow({ store, onPress }: { store: Store; onPress: () => void }) {
  const theme = useTheme();
  const status = getStoreStatus(store.hours, store.timeZone);
  const userCoordinates = useLocationStore((state) => state.coordinates);
  const distance = userCoordinates ? distanceInMeters(userCoordinates, store.coordinates) : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${store.name}, the permanent Mongmo café. ${status.label}. Open details.`}
      style={({ pressed }) => [
        styles.storeCard,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.storeHeader}>
        <MapPin size={16} color={theme.textSecondary} />
        <ThemedText type="smallBold" style={styles.storeTitle} numberOfLines={1}>
          {store.name} · the café
        </ThemedText>
        <ThemedText
          type="small"
          style={{ color: status.isOpen ? theme.success : theme.textSecondary, fontWeight: '700' }}
        >
          {status.label}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {store.address}
        {distance !== null ? ` · ${formatDistance(distance)} away` : ''}
      </ThemedText>
      <CapacityMeter occupancy={store.busy.occupancy} capacity={store.busy.capacity} label="Inside now" />
    </Pressable>
  );
}

/** Accessible, non-map alternative: the same pop-ups as cards, nearest/soonest first. */
export default function ListMode({
  store,
  events,
  filter,
  isLoading,
  isError,
  onRetry,
  onSelectStore,
  onSelectEvent,
}: ListModeProps) {
  const theme = useTheme();

  const renderItem = useCallback<ListRenderItem<PopUpEvent>>(
    ({ item }) => <EventCard event={item} onPress={() => onSelectEvent(item.id)} />,
    [onSelectEvent],
  );

  const header = store ? <StoreRow store={store} onPress={onSelectStore} /> : null;

  if (isLoading && events.length === 0) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText type="small" themeColor="textSecondary">
          Loading pop-ups…
        </ThemedText>
      </View>
    );
  }

  if (isError && events.length === 0) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ThemedText type="smallBold">Couldn&apos;t load events</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
          Something went wrong on our side. Try again in a moment.
        </ThemedText>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry loading events"
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <ThemedText type="smallBold">Retry</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
            {EMPTY_FILTER_COPY[filter]}
          </ThemedText>
        </View>
      }
      contentContainerStyle={styles.content}
      style={[styles.list, { backgroundColor: theme.background }]}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  separator: {
    height: Spacing.three,
  },
  storeCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  storeTitle: {
    flex: 1,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  stateBody: {
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyState: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  retryButton: {
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
});
