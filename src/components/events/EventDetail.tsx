import { useCallback, type ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChallengesSection from '@/components/challenges/ChallengesSection';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconBadge } from '@/components/ui/IconBadge';
import { PhotoHero } from '@/components/ui/PhotoHero';
import { ScreenReaderTitle } from '@/components/ui/ScreenReaderTitle';
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
import { showError, showMessage } from '@/services/confirm';
import { openDirections } from '@/services/directions';
import { haptics } from '@/services/haptics';
import { UPDATE_APP_MESSAGE } from '@/services/nativeModules';
import { switchPickup } from '@/services/switchPickup';
import { useBusyStore } from '@/state/busyStore';
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

  const openOrder = useCallback(async () => {
    if (!event) return;
    if (await switchPickup({ type: 'event', eventId: event.id, eventTitle: event.title })) router.navigate('/(orders)');
  }, [event, router]);

  const onAddToCalendar = useCallback(async () => {
    if (!event) return;
    try {
      const result = await addToCalendar(event);
      if (result === 'added') haptics.success();
      if (result === 'unavailable') showMessage('Add to calendar', UPDATE_APP_MESSAGE);
    } catch (error) {
      haptics.error();
      showError('Couldn’t add it', error);
    }
  }, [event]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(popups)'));
  // A way back from the loading and error states too, not only from the page.
  const backButton = (
    <View style={[styles.stateBack, { top: insets.top + 10 }]}>
      <SquareIconButton icon="chevronLeft" onPress={back} accessibilityLabel="Back" size={44} />
    </View>
  );

  if (!eventId) {
    return (
      <StateCard
        title="Event not found"
        body="This link doesn't match any event. Check Pop-ups for what's on."
        back={backButton}
      />
    );
  }

  if (query.isPending) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: theme.background }]} accessibilityLabel="Loading">
        <ScreenReaderTitle>Pop-up</ScreenReaderTitle>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText type="caption" themeColor="textSecondary">
          Loading the pop-up…
        </ThemedText>
        {backButton}
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
        back={backButton}
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
        headingLevel={1}
        top={
          <View style={[styles.heroTop, { top: insets.top + 10 }]}>
            <SquareIconButton icon="chevronLeft" onPress={back} accessibilityLabel="Back" size={44} />
            <SquareIconButton icon="share" onPress={onShare} accessibilityLabel="Share this pop-up" size={44} />
          </View>
        }
      />

      <View style={styles.page}>
        {/* The facts, one per line, all the same size: when, where, and
            (before it starts) when check-in opens. */}
        <View style={styles.facts}>
          <Fact icon="calendar" title={timeLabel} />
          <Fact icon="pin" title={event.venue} subtitle={event.city} />
          {phase === 'upcoming' ? (
            <Fact
              icon="clock"
              title={`Check-in opens ${opensAt}`}
              subtitle="Check in, order and do the challenges once it starts."
            />
          ) : phase === 'ended' ? (
            <Fact icon="clock" title="This pop-up has ended" subtitle="Keep an eye on Pop-ups for the next one." />
          ) : null}
        </View>

        {phase === 'live' ? (
          <View style={styles.busy} accessible accessibilityLabel={`How busy: ${busy.occupancy} of ${busy.capacity}`}>
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
        ) : null}

        {phase !== 'ended' ? (
          <View style={styles.links}>
            <TextLink label="Add to calendar" icon="calendarAdd" onPress={onAddToCalendar} />
            <TextLink
              icon="directions"
              label="Directions"
              onPress={() => openDirections(event.coordinates, `${event.title}, ${event.venue}`)}
            />
          </View>
        ) : null}

        {event.description ? (
          <View style={styles.about}>
            <ThemedText type="section" accessibilityRole="header">
              About
            </ThemedText>
            <ThemedText type="default">{event.description}</ThemedText>
          </View>
        ) : null}

        <ChallengesSection event={event} checkedIn={checkedIn} phase={phase} opensAt={opensAt} />
      </View>
    </ScrollView>
  );
}

/** Centered not-found / error state, with a retry when it's worth one. */
function StateCard({
  title,
  body,
  onRetry,
  back,
}: {
  title: string;
  body: string;
  onRetry?: () => void;
  back: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.stateContainer, { backgroundColor: theme.background }]}>
      <Card style={styles.stateCard}>
        <View accessibilityRole={onRetry ? 'alert' : 'text'} style={styles.stateTexts}>
          <IconBadge name="alert" size={48} />
          <ThemedText type="section" accessibilityRole="header" headingLevel={1} style={styles.center}>
            {title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {body}
          </ThemedText>
        </View>
        {onRetry ? <Button label="Try again" variant="ghost" size="medium" onPress={onRetry} /> : null}
      </Card>
      {back}
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
  facts: {
    gap: 14,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  about: {
    gap: 6,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: 16,
    paddingVertical: 4,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  stateBack: {
    position: 'absolute',
    left: PageInset,
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

/** One fact about the pop-up: an icon, a line, and maybe a quieter line under it. */
function Fact({ icon, title, subtitle }: { icon: IconName; title: string; subtitle?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.fact} accessible>
      <Icon name={icon} size={20} color={theme.text} />
      <View style={styles.flex}>
        <ThemedText type="smallBold">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}
