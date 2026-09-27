import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowRight, Coffee, Sparkles } from 'lucide-react-native';

import EventCard from '@/components/events/EventCard';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { Spacing } from '@/constants/theme';
import { useActiveOrder } from '@/hooks/useActiveOrder';
import { useEvents } from '@/hooks/useEvents';
import { useProfile } from '@/hooks/useProfile';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore } from '@/state/cartStore';
import { useLocationStore } from '@/state/locationStore';
import { distanceInMeters } from '@/utils/distance';
import { getEventPhase } from '@/utils/dateTime';
import type { PopUpEvent } from '@/types';

const ORDER_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  paid: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  collected: 'Collected',
  cancelled: 'Cancelled',
};

/**
 * Home tab: nearby pop-ups, whatever's in progress (an active order or the
 * live event right now), and a quick entry into ordering the usual.
 */
export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const storeQuery = useStore();
  const eventsQuery = useEvents('all');
  const activeOrder = useActiveOrder();
  const userCoordinates = useLocationStore((state) => state.coordinates);

  const nearbyEvents = useMemo(() => {
    const events = eventsQuery.data ?? [];
    if (!userCoordinates) return events.slice(0, 3);
    return [...events]
      .sort(
        (a, b) =>
          distanceInMeters(userCoordinates, a.coordinates) -
          distanceInMeters(userCoordinates, b.coordinates),
      )
      .slice(0, 3);
  }, [eventsQuery.data, userCoordinates]);

  const liveEvent = useMemo<PopUpEvent | undefined>(
    () => (eventsQuery.data ?? []).find((event) => getEventPhase(event.startsAt, event.endsAt) === 'live'),
    [eventsQuery.data],
  );

  const onSelectEvent = useCallback(
    (id: string) => router.push({ pathname: '/(explore)/event/[id]', params: { id } }),
    [router],
  );

  const onOrderUsual = useCallback(() => {
    if (!storeQuery.data) return;
    useCartStore.getState().setLocation({ type: 'store', storeId: storeQuery.data.id });
    router.push('/(orders)/order/menu');
  }, [router, storeQuery.data]);

  const firstName = profile.data?.name.split(' ')[0] ?? '';

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <ThemedText type="title" style={styles.greeting}>
        {firstName ? `Hi, ${firstName}` : 'Hi there'}
      </ThemedText>
      <ThemedText type="label" themeColor="textSecondary" style={styles.tagline}>
        Discover the next flavour
      </ThemedText>

      {/* Continue: whichever is more relevant right now — an order in
          flight, or a pop-up that's actually live. */}
      {activeOrder.data ? (
        <Card
          tone="accent"
          onPress={() => router.push('/(orders)')}
          accessibilityLabel={`Your order is ${ORDER_STATUS_LABEL[activeOrder.data.status] ?? activeOrder.data.status}. View order.`}
          style={styles.row}
        >
          <Coffee size={22} color={theme.onAccent} />
          <View style={styles.cardTexts}>
            <ThemedText type="section" style={{ color: theme.onAccent }}>
              {ORDER_STATUS_LABEL[activeOrder.data.status] ?? activeOrder.data.status}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.onAccent }}>
              Your order is on its way — tap to view status.
            </ThemedText>
          </View>
          <ArrowRight size={20} color={theme.onAccent} />
        </Card>
      ) : liveEvent ? (
        <Card
          tone="highlight"
          onPress={() => onSelectEvent(liveEvent.id)}
          accessibilityLabel={`${liveEvent.title} is live now in ${liveEvent.city}. Open event.`}
          style={styles.row}
        >
          <Sparkles size={22} color={theme.onHighlight} />
          <View style={styles.cardTexts}>
            <Chip label="Live now" tone="neutral" style={styles.liveChip} />
            <ThemedText type="section" style={{ color: theme.onHighlight }}>
              {liveEvent.title}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.onHighlight }}>
              In {liveEvent.city} — check in and complete a challenge.
            </ThemedText>
          </View>
          <ArrowRight size={20} color={theme.onHighlight} />
        </Card>
      ) : null}

      <Button
        label="Order your usual"
        accessibilityLabel="Order your usual from the café menu"
        icon={<Coffee size={20} color={theme.onPrimary} />}
        onPress={onOrderUsual}
      />

      <ThemedText type="section" style={styles.sectionTitle}>
        Nearby pop-ups
      </ThemedText>

      {eventsQuery.isPending ? (
        <ActivityIndicator size="small" color={theme.text} style={styles.loader} />
      ) : nearbyEvents.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Nothing on right now — check Explore for what&apos;s next.
        </ThemedText>
      ) : (
        <View style={styles.eventsList}>
          {nearbyEvents.map((event) => (
            <EventCard key={event.id} event={event} onPress={() => onSelectEvent(event.id)} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  greeting: {
    fontSize: 44,
    lineHeight: 46,
  },
  tagline: {
    marginTop: -Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  cardTexts: {
    flex: 1,
    gap: 2,
  },
  liveChip: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.one,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  eventsList: {
    gap: Spacing.three,
  },
  loader: {
    marginVertical: Spacing.four,
  },
});
