import { useCallback, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { formatInTimeZone } from 'date-fns-tz';

import QrScanner from '@/components/camera/QrScanner';
import ChallengesSection from '@/components/challenges/ChallengesSection';
import CapacityMeter from '@/components/events/CapacityMeter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { IconBadge } from '@/components/ui/IconBadge';
import { IconButton } from '@/components/ui/IconButton';
import { SectionHeader, usePullToRefresh } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ApiError } from '@/api/errors';
import { EVENTS_PAGE_URL, GEOFENCE_RADIUS_M } from '@/constants/config';
import { Radius, Spacing } from '@/constants/theme';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useCheckInMutation } from '@/hooks/useCheckInMutation';
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
  const tabBarInset = useTabBarInset();
  const query = useEvent(eventId);
  const event = query.data;
  const busyFromStore = useBusyStore((state) => (event ? state.busy[event.id] : undefined));
  const userCoordinates = useLocationStore((state) => state.coordinates);
  const checkIn = useCheckIn(eventId);
  const checkedIn = Boolean(checkIn.data);
  const checkInMutation = useCheckInMutation(eventId);
  const [scannerVisible, setScannerVisible] = useState(false);
  // Re-renders each minute, so "Check-in opens at…" turns into "Check in" on time.
  const now = useNow();
  const refresh = usePullToRefresh();

  const onScanned = useCallback(
    (qrToken: string) => {
      setScannerVisible(false);
      if (!userCoordinates) {
        haptics.warning();
        Alert.alert('Location needed', 'Turn on location access so we can confirm you’re at the venue.');
        return;
      }
      checkInMutation.mutate(
        { qrToken, coordinates: userCoordinates },
        {
          onSuccess: () => {
            haptics.success();
            AccessibilityInfo.announceForAccessibility('Checked in. Points and badges updated.');
          },
          onError: (error) => {
            haptics.error();
            Alert.alert('Check-in failed', error instanceof Error ? error.message : 'Please try again.');
          },
        },
      );
    },
    [checkInMutation, userCoordinates],
  );

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
    router.push('/(orders)/order/menu');
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

  const onPressCheckIn = useCallback(() => {
    if (!event || checkedIn) return;
    // Friendly client-side heads-up before even opening the camera — the
    // server (verify_check_in) is still the one that actually enforces this.
    if (userCoordinates && distanceInMeters(userCoordinates, event.coordinates) > GEOFENCE_RADIUS_M) {
      haptics.warning();
      Alert.alert('Too far to check in', 'Get within 500 m of the venue, then scan the QR code.');
      return;
    }
    setScannerVisible(true);
  }, [event, checkedIn, userCoordinates]);

  if (!eventId) {
    return (
      <StateCard title="Event not found" body="This link doesn't match any event. Check Explore for what's on." />
    );
  }

  if (query.isPending) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText type="small" themeColor="textSecondary">
          Loading event…
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
  const isFull = busy.occupancy >= busy.capacity;
  const distance = userCoordinates ? distanceInMeters(userCoordinates, event.coordinates) : null;
  const timeLabel = formatEventWindow(event.startsAt, event.endsAt, event.timeZone);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + Spacing.five }]}
      refreshControl={
        <RefreshControl refreshing={refresh.refreshing} onRefresh={refresh.onRefresh} tintColor={theme.textSecondary} />
      }
    >
      <View>
        {event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            style={[styles.photo, { backgroundColor: theme.backgroundSelected }]}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`Photo for ${event.title}`}
          />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder, { backgroundColor: theme.accent }]}>
            <IconBadge name="takeout" tone="card" size={72} />
          </View>
        )}
        <View style={styles.photoBar} pointerEvents="box-none">
          <View style={styles.chips}>
            <Chip
              label={phase === 'live' ? 'Live now' : phase === 'upcoming' ? 'Upcoming' : 'Ended'}
              tone={phase === 'live' ? 'live' : 'dark'}
            />
            {isFull ? <Chip label="Full" tone="danger" /> : null}
          </View>
          <IconButton icon="share" onPress={onShare} accessibilityLabel="Share" size={40} />
        </View>
      </View>

      <View style={styles.heading}>
        <ThemedText type="title" accessibilityRole="header">
          {event.title}
        </ThemedText>
        {event.tags.length > 0 ? (
          <View style={styles.chips}>
            {event.tags.map((tag) => (
              <Chip key={tag} label={tag} />
            ))}
          </View>
        ) : null}
      </View>

      <Card style={styles.facts}>
        <Fact icon="clock" title={timeLabel} />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Fact
          icon="pin"
          title={`${event.venue}, ${event.city}`}
          subtitle={distance !== null ? `${formatDistance(distance)} away` : undefined}
        />
      </Card>

      {phase === 'live' ? (
        <Card>
          <CapacityMeter occupancy={busy.occupancy} capacity={busy.capacity} label="How busy right now" />
        </Card>
      ) : null}

      {phase === 'live' ? (
        <View style={styles.actions}>
          <Button
            label={checkedIn ? 'Checked in' : 'Check in'}
            icon={checkedIn ? 'checkCircle' : 'scan'}
            variant={checkedIn ? 'secondary' : 'brand'}
            onPress={onPressCheckIn}
            disabled={checkedIn}
            haptic="press"
            style={styles.action}
          />
          {event.menu.length > 0 ? (
            <Button label="Order" icon="bag" variant="primary" onPress={openOrder} style={styles.action} />
          ) : null}
        </View>
      ) : (
        <Card tone="muted" style={styles.notice}>
          <IconBadge name={phase === 'upcoming' ? 'calendar' : 'clock'} tone="card" size={40} />
          <View style={styles.noticeTexts}>
            <ThemedText type="smallBold">
              {phase === 'upcoming' ? `Check-in opens ${opensAt}` : 'This pop-up has ended'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {phase === 'upcoming'
                ? 'Check in, order and do the challenges once it starts.'
                : 'Keep an eye on Explore for the next one.'}
            </ThemedText>
          </View>
        </Card>
      )}

      {phase !== 'ended' ? (
        <View style={styles.actions}>
          <Button
            label="Add to calendar"
            icon="calendar"
            variant={phase === 'upcoming' ? 'primary' : 'ghost'}
            size="medium"
            onPress={onAddToCalendar}
            style={styles.action}
          />
          <Button
            label="Directions"
            icon="distance"
            variant="ghost"
            size="medium"
            onPress={() => openDirections(event.coordinates, `${event.title}, ${event.venue}`)}
            style={styles.action}
          />
        </View>
      ) : null}

      {event.menu.length > 0 ? (
        <>
          <SectionHeader title="Menu" />
          <Card style={styles.menu}>
            {event.menu.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
                <View style={styles.menuRow}>
                  <View style={styles.menuTexts}>
                    <ThemedText type="smallBold">{item.name}</ThemedText>
                    {item.description ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.description}
                      </ThemedText>
                    ) : null}
                  </View>
                  {item.price ? <ThemedText type="smallBold">{item.price}</ThemedText> : null}
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {event.description ? (
        <>
          <SectionHeader title="About" />
          <ThemedText themeColor="textSecondary">{event.description}</ThemedText>
        </>
      ) : null}

      <ChallengesSection event={event} checkedIn={checkedIn} phase={phase} opensAt={opensAt} />

      <QrScanner
        visible={scannerVisible}
        title="Scan the event QR code"
        onScan={onScanned}
        onClose={() => setScannerVisible(false)}
      />
    </ScrollView>
  );
}

function Fact({ icon, title, subtitle }: { icon: 'clock' | 'pin'; title: string; subtitle?: string }) {
  return (
    <View style={styles.fact}>
      <IconBadge name={icon} size={36} />
      <View style={styles.factTexts}>
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
  content: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  photo: {
    width: '100%',
    height: 260,
    borderRadius: Radius.large,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBar: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heading: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
    flexShrink: 1,
  },
  facts: {
    gap: Spacing.three,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  factTexts: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two + Spacing.one,
  },
  action: {
    flexGrow: 1,
    flexBasis: 140,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  noticeTexts: {
    flex: 1,
    gap: 2,
  },
  menu: {
    paddingVertical: Spacing.two,
    gap: 0,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.two + Spacing.one,
  },
  menuTexts: {
    flex: 1,
    gap: 2,
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
