import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useEvents } from '@/hooks/useEvents';
import { useEventsWithMenu } from '@/hooks/useEventsWithMenu';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore } from '@/state/cartStore';

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

  const eventOptions = useMemo(
    () => (eventsQuery.data ?? []).filter((event) => eventsWithMenu.data?.includes(event.id)),
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

  const isLoading = storeQuery.isPending || eventsQuery.isPending;

  if (isLoading) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <ThemedText type="small" themeColor="textSecondary">
        Pickup only — choose where you&apos;ll collect your order.
      </ThemedText>

      {storeQuery.data ? (
        <Pressable
          onPress={chooseStore}
          accessibilityRole="button"
          accessibilityLabel={`At Mongmo café, ${storeQuery.data.address}`}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <ThemedText type="smallBold">At Mongmo café</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {storeQuery.data.address}
          </ThemedText>
        </Pressable>
      ) : null}

      {eventOptions.map((event) => (
        <Pressable
          key={event.id}
          onPress={() => chooseEvent(event.id, event.title)}
          accessibilityRole="button"
          accessibilityLabel={`At the pop-up, ${event.title}, ${event.venue}`}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <ThemedText type="smallBold">Pickup at the truck — {event.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {event.venue}, {event.city}
          </ThemedText>
        </Pressable>
      ))}

      {eventOptions.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No pop-up menus available right now — the café is always open for pickup.
        </ThemedText>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    padding: Spacing.three,
    gap: Spacing.half,
  },
});
