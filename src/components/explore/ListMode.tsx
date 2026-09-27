import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View, type ListRenderItem } from 'react-native';

import CapacityMeter from '@/components/events/CapacityMeter';
import EventCard from '@/components/events/EventCard';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { IconBadge } from '@/components/ui/IconBadge';
import { usePullToRefresh } from '@/components/ui/Screen';
import { Spacing } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/useTabBarInset';
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
  const status = getStoreStatus(store.hours, store.timeZone);
  const userCoordinates = useLocationStore((state) => state.coordinates);
  const distance = userCoordinates ? distanceInMeters(userCoordinates, store.coordinates) : null;

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${store.name}, the permanent Mongmo café. ${status.label}. Open details.`}
      style={styles.storeCard}
    >
      <View style={styles.storeHeader}>
        <IconBadge name="store" tone="primary" size={44} />
        <View style={styles.storeTexts}>
          <ThemedText type="section" numberOfLines={1}>
            {store.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {store.address}
            {distance !== null ? ` · ${formatDistance(distance)}` : ''}
          </ThemedText>
        </View>
        <Chip label={status.isOpen ? 'Open' : 'Closed'} tone={status.isOpen ? 'success' : 'neutral'} />
      </View>
      <CapacityMeter occupancy={store.busy.occupancy} capacity={store.busy.capacity} label="Inside now" />
    </Card>
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
  const tabBarInset = useTabBarInset();
  const refresh = usePullToRefresh();

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
        <IconBadge name="alert" size={56} />
        <ThemedText type="section">Couldn&apos;t load events</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
          Something went wrong on our side. Try again in a moment.
        </ThemedText>
        <Button label="Retry" accessibilityLabel="Retry loading events" size="medium" onPress={onRetry} />
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
          <IconBadge name="calendar" size={56} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
            {EMPTY_FILTER_COPY[filter]}
          </ThemedText>
        </View>
      }
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + Spacing.five }]}
      style={[styles.list, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refresh.refreshing} onRefresh={refresh.onRefresh} tintColor={theme.textSecondary} />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingTop: Spacing.two,
  },
  separator: {
    height: Spacing.two + Spacing.one,
  },
  storeCard: {
    gap: Spacing.three,
    marginBottom: Spacing.two + Spacing.one,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  storeTexts: {
    flex: 1,
    gap: 2,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  stateBody: {
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyState: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
    gap: Spacing.three,
  },
});
