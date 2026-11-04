import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { formatInTimeZone } from 'date-fns-tz';

import { shortName } from '@/components/achievements/LeaderboardList';
import { ThemedText } from '@/components/ThemedText';
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
import { switchPickup } from '@/services/switchPickup';
import { useBusyStore } from '@/state/busyStore';
import { useLocationStore } from '@/state/locationStore';
import { formatEventWindow, getEventPhase } from '@/utils/dateTime';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { ORDER_STEP, ORDER_STEPS, ORDER_STATUS_TITLE, pickupCode } from '@/utils/orderFormat';
import { STAMP_VALUE_LABEL, stampCard } from '@/utils/stamps';
import type { PopUpEvent } from '@/types';

/** Stamps on the card: one per sixth of the way to the next reward. */

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
  const stamps = stampCard(summary.points, nextReward);

  // "rafaela.henriques" (a name made from an email) greets as "Rafaela".
  const firstName = profile.data?.name ? shortName(profile.data.name).split(' ')[0] : '';
  const order = activeOrder.data;
  const openEvent = (id: string) => router.push({ pathname: '/(popups)/event/[id]', params: { id } });
  const orderAt = async (event: PopUpEvent) => {
    if (await switchPickup({ type: 'event', eventId: event.id, eventTitle: event.title })) router.navigate('/(orders)');
  };
  const orderFromStore = async () => {
    if (!store.data) return;
    if (await switchPickup({ type: 'store', storeId: store.data.id })) router.navigate('/(orders)');
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader title="Home" />
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
          headingLevel={2}
          accessibilityLabel={featured ? `${featured.title}. Open the pop-up.` : undefined}
          top={
            <View style={styles.heroTop}>
              <Pressable
                onPress={() => router.push('/(home)/notifications')}
                accessibilityRole="button"
                accessibilityLabel={`Notifications${feed.unseen ? `, ${feed.unseen} new` : ''}`}
                hitSlop={12}
                style={styles.target}
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
              onCheckIn={() => router.push({ pathname: '/(popups)/check-in/[id]', params: { id: featured.id } })}
              onOrder={() => orderAt(featured)}
              onOpen={() => openEvent(featured.id)}
            />
          </View>
        ) : null}

        {order ? (
          <View style={[styles.block, { backgroundColor: theme.backgroundSelected }]}>
            <ColumnRow label="Your order">
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
          {/* A card, not one big button: the QR button and the Wallet link
              inside it are buttons of their own. */}
          <View style={[styles.pointsCard, { backgroundColor: theme.brandFill }]}>
            <View style={styles.titleRow}>
              <View style={styles.flex} accessible accessibilityLabel={`My points: ${summary.points}`}>
                <ThemedText type="captionBold" style={{ color: theme.onBrand }}>
                  My points
                </ThemedText>
                <View style={styles.pointsLine}>
                  <ThemedText type="display" style={[styles.pointsNumber, { color: theme.onBrand }]}>
                    {summary.points}
                  </ThemedText>
                  <ThemedText type="title" style={{ color: theme.onBrandSoft }}>
                    POINTS
                  </ThemedText>
                </View>
              </View>
              <RoundIconButton
                icon="qrcode"
                onPress={() => router.push('/(wallet)/card')}
                accessibilityLabel="Show my membership QR code"
              />
            </View>
            <StampRow
              earned={stamps.earned}
              total={stamps.total}
              partial={stamps.partial}
              onBrand
              style={styles.stamps}
            />
            <Pressable
              onPress={() => router.navigate('/(wallet)')}
              accessibilityRole="button"
              accessibilityHint="Opens Wallet"
              hitSlop={8}
              style={({ pressed }) => [styles.titleRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.flex}>
                <ThemedText type="smallBold" style={{ color: theme.onBrand }}>
                  {nextReward
                    ? `${nextReward.costPoints - summary.points} more points to: ${nextReward.title}`
                    : 'You can redeem a reward'}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.onBrand }}>
                  {STAMP_VALUE_LABEL}
                </ThemedText>
              </View>
              <Icon name="arrowRight" size={20} color={theme.onBrand} weight="bold" />
            </Pressable>
          </View>
        </View>

        <View style={[styles.nextUp, { backgroundColor: theme.surfaceDark }]}>
          <View style={styles.nextHead}>
            <ThemedText type="title" style={{ color: theme.onSurfaceDark }} accessibilityRole="header">
              Next up
            </ThemedText>
            <Pressable
              onPress={() => router.push('/(popups)')}
              accessibilityRole="link"
              hitSlop={10}
              style={styles.target}
            >
              <ThemedText type="captionBold" style={{ color: theme.onSurfaceDark }}>
                View all
              </ThemedText>
            </Pressable>
          </View>
          {upcoming.length === 0 ? (
            <Pressable onPress={orderFromStore} accessibilityRole="button" style={styles.upRow}>
              <ThemedText type="caption" style={{ color: theme.onSurfaceDarkMuted }}>
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
                    <Image
                      accessible={false}
                      accessibilityLabel=""
                      source={{ uri: event.imageUrl }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                  ) : null}
                </View>
                <View style={styles.flex}>
                  <ThemedText type="smallBold" style={{ color: theme.onSurfaceDark }} numberOfLines={1}>
                    {event.title}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.onSurfaceDarkMuted }} numberOfLines={1}>
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

/** "Right now": the live (or next) pop-up, with check in and order buttons. */
function FeaturedRow({
  event,
  onCheckIn,
  onOrder,
  onOpen,
}: {
  event: PopUpEvent;
  onCheckIn: () => void;
  onOrder: () => void;
  onOpen: () => void;
}) {
  const busy = useBusyStore((state) => state.busy[event.id] ?? event.busy);
  const live = getEventPhase(event.startsAt, event.endsAt) === 'live';
  return (
    <ColumnRow label={live ? 'Right now' : 'Coming up'}>
      <ThemedText type="smallBold">{event.venue}</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {formatEventWindow(event.startsAt, event.endsAt, event.timeZone)}
        {'\n'}How busy: {busy.occupancy} of {busy.capacity}
      </ThemedText>
      {/* Two short labels in equal halves: they fit on any phone. */}
      <View style={styles.actions}>
        {live ? (
          <>
            <Button label="Check in" variant="brand" onPress={onCheckIn} style={styles.flex} />
            <Button label="Order" variant="ghost" onPress={onOrder} style={styles.flex} />
          </>
        ) : (
          <>
            <Button label="Details" variant="brand" onPress={onOpen} style={styles.flex} />
            <Button
              label="Order"
              accessibilityLabel="Order ahead"
              variant="ghost"
              onPress={onOrder}
              style={styles.flex}
            />
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
    // The 44pt-tall greeting centres its text, so it starts 12pt higher.
    top: 2,
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
  pointsCard: {
    marginTop: 14,
    marginBottom: 22,
    padding: 18,
    gap: 12,
  },
  pointsLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  pointsNumber: {
    fontSize: 56,
    // Never below the font size: iOS cuts the top off the glyphs.
    lineHeight: 60,
  },
  stamps: {
    marginVertical: 2,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
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
  /** A text-only control, 44pt tall so it's easy to hit. */
  target: {
    minHeight: 44,
    justifyContent: 'center',
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
