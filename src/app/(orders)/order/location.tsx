import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ScreenScroll } from '@/components/ui/Screen';
import { TaskCard } from '@/components/ui/TaskCard';
import { useEvents } from '@/hooks/useEvents';
import { useEventsWithMenu } from '@/hooks/useEventsWithMenu';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { switchPickup } from '@/services/switchPickup';
import { getEventPhase, getStoreStatus } from '@/utils/dateTime';

/**
 * Where to pick up: the bakery, or a pop-up that's on now with a menu.
 * Choosing one goes back to its menu (a new place starts a new cart).
 */
export default function OrderLocationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const storeQuery = useStore();
  const eventsQuery = useEvents('all');
  const eventsWithMenu = useEventsWithMenu();

  // Only pop-ups that are on right now take orders (the server agrees).
  const eventOptions = useMemo(
    () =>
      (eventsQuery.data ?? []).filter(
        (event) => eventsWithMenu.data?.includes(event.id) && getEventPhase(event.startsAt, event.endsAt) === 'live',
      ),
    [eventsQuery.data, eventsWithMenu.data],
  );

  const chooseStore = useCallback(async () => {
    if (!storeQuery.data) return;
    if (await switchPickup({ type: 'store', storeId: storeQuery.data.id })) router.dismissTo('/(orders)');
  }, [router, storeQuery.data]);

  const chooseEvent = useCallback(
    async (eventId: string, eventTitle: string) => {
      if (await switchPickup({ type: 'event', eventId, eventTitle })) router.dismissTo('/(orders)');
    },
    [router],
  );

  if (storeQuery.isPending || eventsQuery.isPending) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  const store = storeQuery.data;
  return (
    <ScreenScroll>
      <ThemedText type="caption" themeColor="textSecondary">
        Each place has its own menu. Pay when you pick up.
      </ThemedText>
      {store ? (
        <TaskCard
          icon="store"
          title="The bakery"
          subtitle={`${getStoreStatus(store.hours, store.timeZone).label} · ${store.address}`}
          state="arrow"
          onPress={chooseStore}
        />
      ) : null}
      {eventOptions.map((event) => (
        <TaskCard
          key={event.id}
          icon="pin"
          title={event.title}
          subtitle={`Live now · ${event.venue}`}
          state="arrow"
          onPress={() => chooseEvent(event.id, event.title)}
        />
      ))}
      {eventOptions.length === 0 ? (
        <ThemedText type="caption" themeColor="textSecondary">
          No pop-up is taking orders right now.
        </ThemedText>
      ) : null}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
