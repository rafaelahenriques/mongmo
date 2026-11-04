import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { formatInTimeZone } from 'date-fns-tz';

import { ThemedText } from '@/components/ThemedText';
import { BigNumber } from '@/components/ui/BigNumber';
import { Button } from '@/components/ui/Button';
import { ColumnRow } from '@/components/ui/ColumnRow';
import { Icon } from '@/components/ui/Icon';
import { PhotoHero } from '@/components/ui/PhotoHero';
import { RoundIconButton } from '@/components/ui/RoundIconButton';
import { usePullToRefresh } from '@/components/ui/Screen';
import { StampRow } from '@/components/ui/Stamps';
import { AppHeader } from '@/components/ui/AppHeader';
import { StepBar } from '@/components/ui/StepBar';
import { PageInset } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useActiveOrder } from '@/hooks/useActiveOrder';
import { useEvents } from '@/hooks/useEvents';
import { useNotificationsFeed } from '@/hooks/useNotificationsFeed';
import { useProfile } from '@/hooks/useProfile';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useBusyStore } from '@/state/busyStore';
import { useCartStore } from '@/state/cartStore';
import { useLocationStore } from '@/state/locationStore';
import { formatEventWindow, getEventPhase } from '@/utils/dateTime';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { ORDER_STEP, ORDER_STEPS, ORDER_STATUS_TITLE, pickupCode } from '@/utils/orderFormat';
import type { PopUpEvent } from '@/types';

/** Stamps on the card: one per sixth of the way to the next reward. */
const STAMPS = 6;

/**
 * H-01 Home: what is on right now, your order, your points, and what's
 * next — in the design's label column, photo first.
 */
export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const refresh = usePullToRefresh();
  const profile = useProfile();
  const store = useStore();
  const eventsQuery = useEvents('all');
  const activeOrder = useActiveOrder();
  const { query: achievements, summary } = useAchievements();
  const feed = useNotificationsFeed();
  const coordinates = useLocationStore((state) => state.coordinates);

  const { featured, upcoming } = useMemo(() => {
    const events = (eventsQuery.data ?? []).filter((event) => getEventPhase(event.startsAt, event.endsAt) !== 'ended');
    const byStart = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const live = byStart.filter((event) => getEventPhase(event.startsAt, event.endsAt) === 'live');
    // The nearest live pop-up, else the next one to start.
    const nearestLive = coordinates
      ? [...live].sort(
          (a, b) => distanceInMeters(coordinates, a.coordinates) - distanceInMeters(coordinates, b.coordinates),
        )[0]
      : live[0];
    const lead = nearestLive ?? byStart[0];
    return {
      featured: lead,
      upcoming: byStart.filter((event) => event.id !== lead?.id).slice(0, 3),
    };
  }, [eventsQuery.data, coordinates]);

  const nextReward = useMemo(
    () =>
      [...(achievements.data?.rewards ?? [])]
        .sort((a, b) => a.costPoints - b.costPoints)
        .find((reward) => reward.costPoints > summary.points),
    [achievements.data?.rewards, summary.points],
  );
  const stamps = nextReward ? Math.floor((summary.points / nextReward.costPoints) * STAMPS) : STAMPS;

  const firstName = profile.data?.name.split(' ')[0] ?? '';
  const order = activeOrder.data;
  const openEvent = (id: string) => router.push({ pathname: '/(popups)/event/[id]', params: { id } });
  const orderAt = (event: PopUpEvent) => {
    useCartStore.getState().setLocation({
      type: 'event',
      eventId: event.id,
      eventTitle: event.title,
    });
    router.navigate('/(orders)');
  };
  const orderFromStore = () => {
    if (!store.data) return;
    useCartStore.getState().setLocation({ type: 'store', storeId: store.data.id });
    router.navigate('/(orders)');
  };

  // Footnote numbers for the label column, in the order the blocks show.
  const notes = { featured: featured ? 1 : 0, order: 0, points: 0 };
  notes.order = order ? notes.featured + 1 : notes.featured;
  notes.points = notes.order + 1;
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={theme.onSurfaceDark}
          />
        }
      >
        <PhotoHero
          imageUrl={featured?.imageUrl}
          title={featured?.title ?? 'Mongmo'}
          live={featured ? getEventPhase(featured.startsAt, featured.endsAt) === 'live' : false}
          meta={
            featured && coordinates ? formatDistance(distanceInMeters(coordinates, featured.coordinates)) : undefined
          }
          onPress={featured ? () => openEvent(featured.id) : undefined}
          accessibilityLabel={featured ? `${featured.title}. Open the pop-up.` : undefined}
          top={
            <View style={styles.heroTop}>
              <Pressable
                onPress={() => router.push('/(home)/notifications')}
                accessibilityRole="button"
                accessibilityLabel={`Notifications${feed.unseen ? `, ${feed.unseen} new` : ''}`}
                hitSlop={12}
              >
                <ThemedText type="captionBold" style={{ color: theme.onSurfaceDark }}>
                  {[firstName ? `Hi, ${firstName}` : 'Hi', feed.unseen ? `${feed.unseen} new` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </ThemedText>
              </Pressable>
            </View>
          }
        />

        {featured ? (
          <View style={styles.page}>
            <View style={[styles.rule, { backgroundColor: theme.text }]} />
            <FeaturedRow
              event={featured}
              index={notes.featured}
              onCheckIn={() => router.push({ pathname: '/(popups)/check-in/[id]', params: { id: featured.id } })}
              onOrder={() => orderAt(featured)}
              onOpen={() => openEvent(featured.id)}
            />
          </View>
        ) : null}

        {order ? (
          <View style={[styles.block, { backgroundColor: theme.backgroundSelected }]}>
            <ColumnRow label="Your order" index={notes.order}>
              <View style={styles.titleRow}>
                <ThemedText type="title">{ORDER_STATUS_TITLE[order.status]}</ThemedText>
                <RoundIconButton
                  icon="arrowRight"
                  onPress={() =>
                    router.push({
                      pathname: '/(orders)/order/status/[id]',
                      params: { id: order.id },
                    })
                  }
                  accessibilityLabel="Open your order"
                />
              </View>
              <ThemedText type="caption" themeColor="textSecondary">
                {pickupCode(order.id)}
                {order.pickup_at ? ` · Pick up at ${new Date(order.pickup_at).toTimeString().slice(0, 5)}` : ''}
              </ThemedText>
              <View style={styles.steps}>
                <StepBar steps={ORDER_STEPS} reached={ORDER_STEP[order.status] ?? 0} />
              </View>
            </ColumnRow>
          </View>
        ) : null}

        <View style={styles.page}>
          <ColumnRow label="My points" index={notes.points} style={styles.points}>
            <View style={styles.titleRow}>
              <BigNumber value={summary.points} word="Points" />
              <RoundIconButton
                icon="qrcode"
                onPress={() => router.push('/(wallet)/card')}
                accessibilityLabel="Show my membership QR code"
              />
            </View>
            <StampRow earned={stamps} total={STAMPS} style={styles.stamps} />
            <View style={styles.titleRow}>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.flex}>
                {nextReward
                  ? `${nextReward.costPoints - summary.points} more to your next reward`
                  : 'You can redeem a reward'}
              </ThemedText>
              <Pressable
                onPress={() => router.push('/(wallet)')}
                accessibilityRole="link"
                hitSlop={10}
                style={styles.link}
              >
                <ThemedText type="captionBold">Rewards</ThemedText>
                <Icon name="arrowRight" size={14} color={theme.text} weight="bold" />
              </Pressable>
            </View>
          </ColumnRow>
        </View>

        <View style={[styles.nextUp, { backgroundColor: theme.surfaceDark }]}>
          <View style={styles.nextHead}>
            <ThemedText type="title" style={{ color: theme.onSurfaceDark }} accessibilityRole="header">
              Next up
            </ThemedText>
            <Pressable onPress={() => router.push('/(popups)')} accessibilityRole="link" hitSlop={10}>
              <ThemedText type="captionBold" style={{ color: theme.onSurfaceDark }}>
                View all
              </ThemedText>
            </Pressable>
          </View>
          {upcoming.length === 0 ? (
            <Pressable onPress={orderFromStore} accessibilityRole="button" style={styles.upRow}>
              <ThemedText type="caption" style={{ color: theme.faded }}>
                Nothing else planned yet. Order ahead from the café meanwhile.
              </ThemedText>
            </Pressable>
          ) : (
            upcoming.map((event, index) => (
              <Pressable
                key={event.id}
                onPress={() => openEvent(event.id)}
                accessibilityRole="button"
                accessibilityLabel={`${event.title}, ${upcomingWhen(event)}`}
                style={[
                  styles.upRow,
                  index < upcoming.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.onSurfaceDark,
                  },
                ]}
              >
                <View style={[styles.thumb, { backgroundColor: theme.textSecondary }]}>
                  {event.imageUrl ? (
                    <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : null}
                </View>
                <View style={styles.flex}>
                  <ThemedText type="smallBold" style={{ color: theme.onSurfaceDark }} numberOfLines={1}>
                    {event.title}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.border }} numberOfLines={1}>
                    {upcomingWhen(event)}
                  </ThemedText>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** "Today, 13:10. Stationsstraat 9." */
function upcomingWhen(event: PopUpEvent): string {
  const start = new Date(event.startsAt);
  const today =
    formatInTimeZone(new Date(), event.timeZone, 'yyyy-MM-dd') ===
    formatInTimeZone(start, event.timeZone, 'yyyy-MM-dd');
  const day = today ? 'Today' : formatInTimeZone(start, event.timeZone, 'EEE d MMM');
  return `${day}, ${formatInTimeZone(start, event.timeZone, 'HH:mm')}. ${event.city}.`;
}

/** "Right now¹": the live (or next) pop-up, with check in and order buttons. */
function FeaturedRow({
  event,
  index,
  onCheckIn,
  onOrder,
  onOpen,
}: {
  event: PopUpEvent;
  index: number;
  onCheckIn: () => void;
  onOrder: () => void;
  onOpen: () => void;
}) {
  const busy = useBusyStore((state) => state.busy[event.id] ?? event.busy);
  const live = getEventPhase(event.startsAt, event.endsAt) === 'live';
  return (
    <ColumnRow label={live ? 'Right now' : 'Coming up'} index={index}>
      <ThemedText type="smallBold">{event.venue}</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {formatEventWindow(event.startsAt, event.endsAt, event.timeZone)}
        {'\n'}How busy: {busy.occupancy} of {busy.capacity}
      </ThemedText>
      <View style={styles.actions}>
        {live ? (
          <>
            <Button label="Check in" variant="brand" onPress={onCheckIn} style={styles.flex} />
            <Button label="Order here" variant="ghost" onPress={onOrder} style={styles.flex} />
          </>
        ) : (
          <>
            <Button label="See details" variant="brand" onPress={onOpen} style={styles.flex} />
            <Button label="Order ahead" variant="ghost" onPress={onOrder} style={styles.flex} />
          </>
        )}
      </View>
    </ColumnRow>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  heroTop: {
    position: 'absolute',
    top: 14,
    left: PageInset,
    right: PageInset,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  page: {
    paddingHorizontal: PageInset,
    paddingTop: 14,
    paddingBottom: 4,
  },
  rule: {
    height: 3,
  },
  block: {
    paddingHorizontal: PageInset,
    paddingTop: 4,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  steps: {
    paddingTop: 8,
  },
  points: {
    paddingTop: 2,
    paddingBottom: 18,
  },
  stamps: {
    marginVertical: 4,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
  },
  flex: {
    flex: 1,
  },
  nextUp: {
    paddingHorizontal: PageInset,
    paddingTop: 22,
    paddingBottom: 6,
    gap: 4,
  },
  nextHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  upRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
});
