import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import EventCard from '@/components/events/EventCard';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { IconBadge } from '@/components/ui/IconBadge';
import { LargeHeader, ScreenScroll, SectionHeader } from '@/components/ui/Screen';
import { Radius, Spacing } from '@/constants/theme';
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
 * Home tab: whatever's in progress (an active order or the live pop-up),
 * quick actions, and the nearest pop-ups.
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
  const orderStatus = activeOrder.data
    ? (ORDER_STATUS_LABEL[activeOrder.data.status] ?? activeOrder.data.status)
    : null;

  return (
    <ScreenScroll topInset>
      <LargeHeader eyebrow="Discover the next flavour" title={firstName ? `Hi, ${firstName}` : 'Hi there'} />

      {/* Continue: whichever matters more right now — an order in flight,
          or a pop-up that's actually live. */}
      {activeOrder.data ? (
        <Card
          tone="primary"
          onPress={() => router.push('/(orders)')}
          accessibilityLabel={`Your order is ${orderStatus}. View order.`}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <Chip label="Your order" tone="info" icon="takeout" />
            <DetailsPill label="View" dark />
          </View>
          <ThemedText type="subtitle" style={{ color: theme.onPrimary }}>
            {orderStatus}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.onPrimary, opacity: 0.8 }}>
            We&apos;ll let you know the moment it&apos;s ready.
          </ThemedText>
        </Card>
      ) : liveEvent ? (
        <Card
          tone="brand"
          onPress={() => onSelectEvent(liveEvent.id)}
          accessibilityLabel={`${liveEvent.title} is live now in ${liveEvent.city}. Open event.`}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={[styles.livePill, { backgroundColor: theme.onBrand }]}>
              <View style={[styles.liveDot, { backgroundColor: theme.brandFill }]} />
              <ThemedText type="smallBold" style={{ color: theme.brandFill }}>
                Live now
              </ThemedText>
            </View>
            <DetailsPill label="Details" />
          </View>
          <ThemedText type="title" style={{ color: theme.onBrand }} numberOfLines={2}>
            {liveEvent.title}
          </ThemedText>
          <View style={styles.heroMeta}>
            <Icon name="pin" size={14} color={theme.onBrand} />
            <ThemedText type="small" style={{ color: theme.onBrand }}>
              {liveEvent.city} · check in for points
            </ThemedText>
          </View>
        </Card>
      ) : null}

      <View style={styles.quickRow}>
        <Card
          tone="accent"
          onPress={onOrderUsual}
          accessibilityLabel="Order your usual from the café menu"
          style={styles.quick}
        >
          <IconBadge name="coffee" tone="card" size={44} />
          <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
            Order your usual
          </ThemedText>
        </Card>
        <Card
          onPress={() => router.push('/(explore)')}
          accessibilityLabel="Explore pop-ups on the map"
          style={styles.quick}
        >
          <IconBadge name="map" tone="muted" size={44} />
          <ThemedText type="smallBold">Explore the map</ThemedText>
        </Card>
      </View>

      <SectionHeader title="Nearby pop-ups" actionLabel="See all" onAction={() => router.push('/(explore)')} />

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
    </ScreenScroll>
  );
}

/** The "Details →" pill in hero cards (decorative; the card is the button). */
function DetailsPill({ label, dark = false }: { label: string; dark?: boolean }) {
  const theme = useTheme();
  // Red on white (4.7:1) on the red card; inverted ink on the primary card.
  const background = dark ? theme.onPrimary : theme.onBrand;
  const foreground = dark ? theme.primary : theme.brandFill;
  return (
    <View style={[styles.detailsPill, { backgroundColor: background }]}>
      <ThemedText type="smallBold" style={{ color: foreground }}>
        {label}
      </ThemedText>
      <Icon name="arrowRight" size={14} color={foreground} weight="bold" />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  detailsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.two + Spacing.one,
  },
  quick: {
    flex: 1,
    gap: Spacing.three,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  eventsList: {
    gap: Spacing.two + Spacing.one,
  },
  loader: {
    marginVertical: Spacing.four,
  },
});
