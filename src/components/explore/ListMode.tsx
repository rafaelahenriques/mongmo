import type { ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { LiveCard, PopupRow } from '@/components/explore/PopupRow';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { usePullToRefresh } from '@/components/ui/Screen';
import { TaskCard } from '@/components/ui/TaskCard';
import { PageInset } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { getEventPhase, getStoreStatus, isToday } from '@/utils/dateTime';
import type { EventFilter, PopUpEvent, Store } from '@/types';

const EMPTY_FILTER_COPY: Record<EventFilter, string> = {
  today: 'No pop-ups today.',
  week: 'No pop-ups this week.',
  all: 'No upcoming pop-ups.',
};

export type ListModeProps = {
  /** The title, filter words and view switch, scrolled with the list. */
  header: ReactNode;
  store: Store | null;
  events: PopUpEvent[];
  filter: EventFilter;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectStore: () => void;
  onSelectEvent: (eventId: string) => void;
  onCheckIn: (eventId: string) => void;
};

/**
 * P-02 Map List: the live pop-up as a photo card with CHECK IN, the rest of
 * today as street-map rows, then "Later", and the café at the end.
 */
export default function ListMode({
  header,
  store,
  events,
  filter,
  isLoading,
  isError,
  onRetry,
  onSelectStore,
  onSelectEvent,
  onCheckIn,
}: ListModeProps) {
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  const refresh = usePullToRefresh();

  const live = events.filter((event) => getEventPhase(event.startsAt, event.endsAt) === 'live');
  const soon = events.filter((event) => !live.includes(event) && isToday(new Date(event.startsAt), event.timeZone));
  const later = events.filter((event) => !live.includes(event) && !soon.includes(event));
  const storeStatus = store ? getStoreStatus(store.hours, store.timeZone) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
      refreshControl={<RefreshControl refreshing={refresh.refreshing} onRefresh={refresh.onRefresh} />}
    >
      {header}

      {isLoading ? <ActivityIndicator color={theme.text} style={styles.loader} /> : null}
      {isError ? (
        <View style={styles.group} accessibilityRole="alert">
          <ThemedText type="caption" themeColor="textSecondary">
            Couldn’t load the pop-ups.
          </ThemedText>
          <Button label="Try again" variant="ghost" size="medium" onPress={onRetry} />
        </View>
      ) : null}
      {!isLoading && !isError && events.length === 0 ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {EMPTY_FILTER_COPY[filter]} The café is open as usual.
        </ThemedText>
      ) : null}

      <View style={styles.group}>
        {live.map((event) => (
          <LiveCard
            key={event.id}
            event={event}
            onOpen={() => onSelectEvent(event.id)}
            onCheckIn={() => onCheckIn(event.id)}
          />
        ))}
        {soon.map((event, index) => (
          <PopupRow key={event.id} event={event} index={index} onPress={() => onSelectEvent(event.id)} />
        ))}
      </View>

      {later.length ? (
        <View style={styles.group}>
          <ThemedText type="subtitle" accessibilityRole="header">
            {filter === 'week' ? 'Later this week' : 'Later'}
          </ThemedText>
          {later.map((event, index) => (
            <PopupRow key={event.id} event={event} index={index + 1} onPress={() => onSelectEvent(event.id)} />
          ))}
        </View>
      ) : null}

      {store && storeStatus ? (
        <View style={styles.group}>
          <ThemedText type="subtitle" accessibilityRole="header">
            The café
          </ThemedText>
          <TaskCard
            icon="store"
            title={store.name}
            subtitle={`${storeStatus.label} · ${store.address}`}
            state="arrow"
            onPress={onSelectStore}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    gap: 16,
  },
  group: {
    gap: 8,
  },
  loader: {
    marginVertical: 24,
  },
});
