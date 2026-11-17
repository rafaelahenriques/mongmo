import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { formatInTimeZone } from 'date-fns-tz';

import { ThemedText } from '@/components/ThemedText';
import { ScreenScroll } from '@/components/ui/Screen';
import { TaskCard } from '@/components/ui/TaskCard';
import { useEvents } from '@/hooks/useEvents';
import { useEventsWithMenu } from '@/hooks/useEventsWithMenu';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { switchPickup } from '@/services/switchPickup';
import { getStoreStatus } from '@/utils/dateTime';
import { orderWindow, takesOrders } from '@/utils/popUps';

/**
 * Where to pick up: the bakery, or a pop-up with a menu that's on now or
 * starts within a day (a pre-order, for a time during it). Choosing one
 * goes back to its menu (a new place starts a new cart).
 */
export default function OrderLocationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const storeQuery = useStore();
  const eventsQuery = useEvents('all');
  const eventsWithMenu = useEventsWithMenu();

  // Pop-ups take orders while they're on, and pre-orders from a day before (the server agrees).
  const eventOptions = useMemo(
    () => (eventsQuery.data ?? []).filter((event) => eventsWithMenu.data?.includes(event.id) && takesOrders(event)),
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
        <ActivityIndicator accessibilityLabel="Loading" size="large" color={theme.text} />
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
          subtitle={
            orderWindow(event) === 'open'
              ? `Live now · ${event.venue}`
              : `Pre-order · starts ${formatInTimeZone(event.startsAt, event.timeZone, "EEE 'at' HH:mm")} · ${event.venue}`
          }
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
