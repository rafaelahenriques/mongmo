import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';

import EventCard from '@/components/events/EventCard';
import OfflineBanner from '@/components/map/OfflineBanner';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useEvents } from '@/hooks/useEvents';
import { useTheme } from '@/hooks/useTheme';
import type { PopUpEvent } from '@/types';

/**
 * Events tab: every upcoming pop-up from the API, with loading, error,
 * offline and empty states. Tapping a card opens the event detail screen.
 */
export default function PopupsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const eventsQuery = useEvents('all');
  const events = eventsQuery.data ?? [];

  const onSelect = useCallback(
    (id: string) => {
      router.push({ pathname: '/(popups)/event/[id]', params: { id } });
    },
    [router],
  );

  const renderItem = useCallback<ListRenderItem<PopUpEvent>>(
    ({ item }) => <EventCard event={item} onPress={() => onSelect(item.id)} />,
    [onSelect],
  );

  const isLoading = eventsQuery.isPending && events.length === 0;
  const showError = eventsQuery.isError && events.length === 0;
  const showEmpty = eventsQuery.isError === false && eventsQuery.data !== undefined && events.length === 0;

  if (isLoading || showError || showEmpty) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <OfflineBanner />
        <View style={styles.state}>
          {isLoading ? (
            <>
              <ActivityIndicator size="large" color={theme.text} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
                {eventsQuery.fetchStatus === 'paused'
                  ? 'Waiting for connection…'
                  : 'Loading events…'}
              </ThemedText>
            </>
          ) : showError ? (
            <>
              <ThemedText type="smallBold" style={styles.stateTitle}>
                Couldn&apos;t load events
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
                {eventsQuery.fetchStatus === 'paused'
                  ? 'You’re offline and no saved events are available yet.'
                  : 'Something went wrong on our side. Try again in a moment.'}
              </ThemedText>
              <View
                accessibilityRole="button"
                accessibilityLabel="Retry loading events"
                onTouchEnd={() => eventsQuery.refetch()}
              />
              <RetryButton onPress={() => eventsQuery.refetch()} theme={theme} />
            </>
          ) : (
            <>
              <ThemedText type="smallBold" style={styles.stateTitle}>
                No pop-ups scheduled
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
                Nothing is on right now — new dates are announced on mongmo-store.com.
                The store in Kortrijk is always on the map.
              </ThemedText>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <OfflineBanner />
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.content}
        style={styles.list}
      />
    </View>
  );
}

function RetryButton({
  onPress,
  theme,
}: {
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      onTouchEnd={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Retry loading events"
      style={[styles.retryButton, { backgroundColor: theme.backgroundSelected }]}
    >
      <ThemedText type="smallBold">Retry</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
  },
  separator: {
    height: Spacing.three,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  stateTitle: {
    textAlign: 'center',
    fontSize: 16,
  },
  stateBody: {
    textAlign: 'center',
    maxWidth: 320,
  },
  retryButton: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
});
