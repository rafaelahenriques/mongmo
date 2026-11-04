import { useCallback } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChallengesSection from '@/components/challenges/ChallengesSection';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { PhotoHero } from '@/components/ui/PhotoHero';
import { usePullToRefresh } from '@/components/ui/Screen';
import { SquareIconButton } from '@/components/ui/SquareIconButton';
import { TextLink } from '@/components/ui/TextLink';
import { ThemedText } from '@/components/ThemedText';
import { ApiError } from '@/api/errors';
import { EVENTS_PAGE_URL } from '@/constants/config';
import { PageInset, Spacing } from '@/constants/theme';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useEvent } from '@/hooks/useEvent';
import { useNow } from '@/hooks/useNow';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { addToCalendar } from '@/services/calendar';
import { openDirections } from '@/services/directions';
import { haptics } from '@/services/haptics';
import { UPDATE_APP_MESSAGE } from '@/services/nativeModules';
import { useBusyStore } from '@/state/busyStore';
import { useCartStore } from '@/state/cartStore';
import { useLocationStore } from '@/state/locationStore';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { formatEventWindow, getEventPhase } from '@/utils/dateTime';

export type EventDetailProps = {
  eventId: string;
};

/**
 * Full-screen pop-up event detail: photo, when and where, live "how busy",
 * check in / order, the menu and the event's challenges.
 */
export default function EventDetail({ eventId }: EventDetailProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const query = useEvent(eventId);
  const event = query.data;
  const busyFromStore = useBusyStore((state) => (event ? state.busy[event.id] : undefined));
  const userCoordinates = useLocationStore((state) => state.coordinates);
  const checkIn = useCheckIn(eventId);
  const checkedIn = Boolean(checkIn.data);
  // Re-renders each minute, so "Check-in opens at…" turns into "Check in" on time.
  const now = useNow();
  const refresh = usePullToRefresh();

  const onShare = useCallback(async () => {
    if (!event) return;
    try {
      await Share.share({
        title: event.title,
        message:
          `${event.title} — ` +
          `${formatEventWindow(event.startsAt, event.endsAt, event.timeZone)} in ${event.city}. ` +
          EVENTS_PAGE_URL,
        url: EVENTS_PAGE_URL,
      });
    } catch {
      // Share sheet dismissed or unavailable — nothing to do.
    }
  }, [event]);

  const openOrder = useCallback(() => {
    if (!event) return;
    useCartStore.getState().setLocation({ type: 'event', eventId: event.id, eventTitle: event.title });
    router.navigate('/(orders)');
  }, [event, router]);

  const onAddToCalendar = useCallback(async () => {
    if (!event) return;
    try {
      const result = await addToCalendar(event);
      if (result === 'added') haptics.success();
      if (result === 'unavailable') Alert.alert('Add to calendar', UPDATE_APP_MESSAGE);
    } catch (error) {
      haptics.error();
      Alert.alert('Couldn’t add it', error instanceof Error ? error.message : 'Please try again.');
    }
  }, [event]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(popups)'));

  if (!eventId) {
    return (
      <StateCard title="Event not found" body="This link doesn't match any event. Check Pop-ups for what's on." />
    );
  }

  if (query.isPending) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText type="caption" themeColor="textSecondary">
          Loading the pop-up…
        </ThemedText>
      </View>
    );
  }

  if (!event) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <StateCard
        title={notFound ? 'Event not found' : 'Couldn’t load this event'}
        body={
          notFound
            ? "This event may have been removed. It's not on the map anymore."
            : 'Check your connection — if you were offline, this event may not be saved for offline viewing yet.'
        }
        onRetry={notFound ? undefined : () => query.refetch()}
      />
    );
  }

  const busy = busyFromStore ?? event.busy;
  const phase = getEventPhase(event.startsAt, event.endsAt, now);
  const opensAt = formatInTimeZone(event.startsAt, event.timeZone, "EEE d MMM 'at' HH:mm");
  const distance = userCoordinates ? distanceInMeters(userCoordinates, event.coordinates) : null;
  const timeLabel = formatEventWindow(event.startsAt, event.endsAt, event.timeZone);
  const busyShare = busy.capacity > 0 ? Math.min(1, busy.occupancy / busy.capacity) : 0;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: tabBarInset + Spacing.five }}
      refreshControl={
        <RefreshControl refreshing={refresh.refreshing} onRefresh={refresh.onRefresh} tintColor={theme.onSurfaceDark} />
      }
    >
      <PhotoHero
        imageUrl={event.imageUrl}
        title={event.title}
        live={phase === 'live'}
        meta={distance !== null ? formatDistance(distance) : undefined}
        height={380}
        top={
          <View style={[styles.heroTop, { top: insets.top + 10 }]}>
            <SquareIconButton icon="chevronLeft" onPress={back} accessibilityLabel="Back" />
            <SquareIconButton icon="share" onPress={onShare} accessibilityLabel="Share this pop-up" />
          </View>
        }
      />

      <View style={styles.page}>
        <View style={styles.where}>
          <ThemedText type="section">{event.venue}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {timeLabel}
          </ThemedText>
        </View>

        {phase === 'live' ? (
          <View
            style={styles.busy}
            accessible
            accessibilityLabel={`How busy: ${busy.occupancy} of ${busy.capacity}`}
          >
            <View style={styles.busyRow}>
              <ThemedText type="caption" themeColor="textSecondary">
                How busy
              </ThemedText>
              <ThemedText type="captionBold">
                {busy.occupancy} of {busy.capacity}
              </ThemedText>
            </View>
            <View style={[styles.busyTrack, { backgroundColor: theme.border }]}>
              <View style={[styles.busyFill, { width: `${busyShare * 100}%`, backgroundColor: theme.text }]} />
            </View>
          </View>
        ) : null}

        {phase === 'live' ? (
          <View style={styles.actions}>
            <Button
              label={checkedIn ? 'Checked in' : 'Check in'}
              variant="brand"
              onPress={() => router.push({ pathname: '/(popups)/check-in/[id]', params: { id: event.id } })}
              disabled={checkedIn}
              haptic="press"
              style={styles.flex}
            />
            <Button
              label="Order here"
              variant="ghost"
              onPress={openOrder}
              disabled={event.menu.length === 0}
              style={styles.flex}
            />
          </View>
        ) : (
          <Card tone="muted" style={styles.notice}>
            <IconBadge name={phase === 'upcoming' ? 'calendar' : 'clock'} tone="card" size={40} />
            <View style={styles.flex}>
              <ThemedText type="smallBold">
                {phase === 'upcoming' ? `Check-in opens ${opensAt}` : 'This pop-up has ended'}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {phase === 'upcoming'
                  ? 'Check in, order and do the challenges once it starts.'
                  : 'Keep an eye on Pop-ups for the next one.'}
              </ThemedText>
            </View>
          </Card>
        )}

        {phase !== 'ended' ? (
          <View style={styles.links}>
            <TextLink label="Add to calendar" onPress={onAddToCalendar} />
            <TextLink
              label="Directions"
              onPress={() => openDirections(event.coordinates, `${event.title}, ${event.venue}`)}
            />
          </View>
        ) : null}

        {event.description ? (
          <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
            {event.description}
          </ThemedText>
        ) : null}

        <ChallengesSection event={event} checkedIn={checkedIn} phase={phase} opensAt={opensAt} />
      </View>
    </ScrollView>
  );
}

/** Centered not-found / error state, with a retry when it's worth one. */
function StateCard({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.stateContainer, { backgroundColor: theme.background }]}>
      <Card style={styles.stateCard}>
        <View accessibilityRole={onRetry ? 'alert' : 'text'} style={styles.stateTexts}>
          <IconBadge name="alert" size={48} />
          <ThemedText type="section" style={styles.center}>
            {title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {body}
          </ThemedText>
        </View>
        {onRetry ? <Button label="Try again" variant="ghost" size="medium" onPress={onRetry} /> : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  heroTop: {
    position: 'absolute',
    left: PageInset,
    right: PageInset,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  page: {
    paddingHorizontal: PageInset,
    paddingTop: 18,
    gap: 16,
  },
  where: {
    gap: 2,
  },
  busy: {
    gap: 8,
  },
  busyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  busyTrack: {
    height: 3,
  },
  busyFill: {
    height: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  flex: {
    flex: 1,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  stateCard: {
    maxWidth: 360,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  stateTexts: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
});
