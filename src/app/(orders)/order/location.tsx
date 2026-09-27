import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenScroll, SectionHeader } from '@/components/ui/Screen';
import { useEvents } from '@/hooks/useEvents';
import { useEventsWithMenu } from '@/hooks/useEventsWithMenu';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore } from '@/state/cartStore';
import { getEventPhase } from '@/utils/dateTime';

/**
 * Order flow, step 1: where is this pickup — the permanent café, or one of
 * the pop-ups that has a menu attached?
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

  const chooseStore = useCallback(() => {
    if (!storeQuery.data) return;
    useCartStore.getState().setLocation({ type: 'store', storeId: storeQuery.data.id });
    router.push('/(orders)/order/menu');
  }, [router, storeQuery.data]);

  const chooseEvent = useCallback(
    (eventId: string, eventTitle: string) => {
      useCartStore.getState().setLocation({ type: 'event', eventId, eventTitle });
      router.push('/(orders)/order/menu');
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

  return (
    <ScreenScroll>
      <ThemedText type="subtitle">Where will you pick up?</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Pickup only — choose where you&apos;ll collect your order.
      </ThemedText>

      {storeQuery.data ? (
        <Card>
          <ListRow
            title="At Mongmo café"
            subtitle={storeQuery.data.address}
            icon="store"
            iconTone="primary"
            onPress={chooseStore}
            accessibilityLabel={`At Mongmo café, ${storeQuery.data.address}`}
          />
        </Card>
      ) : null}

      {eventOptions.length > 0 ? <SectionHeader title="Pop-ups on now" /> : null}
      {eventOptions.map((event) => (
        <Card key={event.id}>
          <ListRow
            title={event.title}
            subtitle={`Pickup at the truck · ${event.venue}, ${event.city}`}
            icon="takeout"
            iconTone="brand"
            onPress={() => chooseEvent(event.id, event.title)}
            accessibilityLabel={`At the pop-up, ${event.title}, ${event.venue}`}
          />
        </Card>
      ))}

      {eventOptions.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No pop-up is open right now — the café is always open for pickup.
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
