import { useCallback, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Check, Clock, MapPin, Navigation, Share2, ShoppingBag } from 'lucide-react-native';

import QrScanner from '@/components/camera/QrScanner';
import ChallengesSection from '@/components/challenges/ChallengesSection';
import CapacityMeter from '@/components/events/CapacityMeter';
import Chip from '@/components/ui/Chip';
import { ThemedText } from '@/components/ThemedText';
import { ApiError } from '@/api/errors';
import { EVENTS_PAGE_URL, GEOFENCE_RADIUS_M } from '@/constants/config';
import { Spacing } from '@/constants/theme';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useCheckInMutation } from '@/hooks/useCheckInMutation';
import { useEvent } from '@/hooks/useEvent';
import { useTheme } from '@/hooks/useTheme';
import { useBusyStore } from '@/state/busyStore';
import { useCartStore } from '@/state/cartStore';
import { useLocationStore } from '@/state/locationStore';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { formatEventWindow, getEventPhase } from '@/utils/dateTime';

const STORE_BROWN = '#8B4513';

export type EventDetailProps = {
  eventId: string;
};

type ActionButtonProps = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

function ActionButton({
  label,
  icon,
  onPress,
  variant = 'secondary',
  disabled = false,
}: ActionButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: isPrimary ? STORE_BROWN : theme.backgroundElement,
          borderColor: isPrimary ? STORE_BROWN : theme.backgroundSelected,
          opacity: disabled ? 0.6 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {icon}
      <ThemedText
        type="smallBold"
        style={isPrimary ? { color: '#FFFFFF' } : undefined}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

/**
 * Full-screen pop-up event detail: hero image, time/location, live capacity,
 * menu preview and the check-in / order / share actions.
 */
export default function EventDetail({ eventId }: EventDetailProps) {
  const theme = useTheme();
  const router = useRouter();
  const query = useEvent(eventId);
  const event = query.data;
  const busyFromStore = useBusyStore((state) => (event ? state.busy[event.id] : undefined));
  const userCoordinates = useLocationStore((state) => state.coordinates);
  const checkIn = useCheckIn(eventId);
  const checkedIn = Boolean(checkIn.data);
  const checkInMutation = useCheckInMutation(eventId);
  const [scannerVisible, setScannerVisible] = useState(false);

  const onScanned = useCallback(
    (qrToken: string) => {
      setScannerVisible(false);
      if (!userCoordinates) {
        Alert.alert(
          'Location needed',
          'Turn on location access so we can confirm you’re at the venue.',
        );
        return;
      }
      checkInMutation.mutate(
        { qrToken, coordinates: userCoordinates },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
            AccessibilityInfo.announceForAccessibility('Checked in. Points and badges updated.');
          },
          onError: (error) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
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

  const onPressCheckIn = useCallback(() => {
    if (!event || checkedIn) return;
    // Friendly client-side heads-up before even opening the camera — the
    // server (verify_check_in) is still the one that actually enforces this.
    if (userCoordinates && distanceInMeters(userCoordinates, event.coordinates) > GEOFENCE_RADIUS_M) {
      Alert.alert('Too far to check in', 'Get within 500 m of the venue, then scan the QR code.');
      return;
    }
    setScannerVisible(true);
  }, [event, checkedIn, userCoordinates]);

  if (!eventId) {
    return (
      <StateCard
        title="Event not found"
        body="This link doesn't match any event. Check the events list for what's on."
        theme={theme}
      />
    );
  }

  if (query.isPending) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
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
        retryLabel={notFound ? undefined : 'Try again'}
        onRetry={notFound ? undefined : () => query.refetch()}
        theme={theme}
      />
    );
  }

  const busy = busyFromStore ?? event.busy;
  const phase = getEventPhase(event.startsAt, event.endsAt);
  const isFull = busy.occupancy >= busy.capacity;
  const distance = userCoordinates
    ? distanceInMeters(userCoordinates, event.coordinates)
    : null;
  const timeLabel = formatEventWindow(event.startsAt, event.endsAt, event.timeZone);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <Image
        source={{ uri: event.imageUrl }}
        style={styles.hero}
        contentFit="cover"
        transition={200}
        accessibilityLabel={`Photo for ${event.title}`}
      />

      <View style={styles.chips}>
        <Chip
          label={phase === 'live' ? 'Live now' : phase === 'upcoming' ? 'Upcoming' : 'Ended'}
          tone={phase === 'live' ? 'success' : 'neutral'}
        />
        {isFull ? <Chip label="Full" tone="danger" /> : null}
        {event.tags.map((tag) => (
          <Chip key={tag} label={tag} />
        ))}
      </View>

      <ThemedText type="subtitle" style={styles.title}>
        {event.title}
      </ThemedText>

      <View style={styles.metaRow}>
        <Clock size={16} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.metaText}>
          {timeLabel}
        </ThemedText>
      </View>
      <View style={styles.metaRow}>
        <MapPin size={16} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.metaText}>
          {event.venue}, {event.city}
        </ThemedText>
      </View>
      {distance !== null ? (
        <View style={styles.metaRow}>
          <Navigation size={16} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.metaText}>
            {formatDistance(distance)} away
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.section}>
        <CapacityMeter
          occupancy={busy.occupancy}
          capacity={busy.capacity}
          label="How busy right now"
        />
      </View>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Menu preview
      </ThemedText>
      {event.menu.map((item) => (
        <View key={item.id} style={styles.menuRow}>
          <View style={styles.menuTexts}>
            <ThemedText type="small">{item.name}</ThemedText>
            {item.description ? (
              <ThemedText type="small" themeColor="textSecondary">
                {item.description}
              </ThemedText>
            ) : null}
          </View>
          {item.price ? (
            <ThemedText type="small" themeColor="textSecondary">
              {item.price}
            </ThemedText>
          ) : null}
        </View>
      ))}

      <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
        {event.description}
      </ThemedText>

      <View style={styles.actions}>
        <ActionButton
          label={checkedIn ? 'Checked in' : 'Check in'}
          icon={<Check size={18} color="#FFFFFF" />}
          onPress={onPressCheckIn}
          variant="primary"
          disabled={checkedIn}
        />
        <ActionButton
          label="Order"
          icon={<ShoppingBag size={18} color={theme.text} />}
          onPress={openOrder}
        />
        <ActionButton
          label="Share"
          icon={<Share2 size={18} color={theme.text} />}
          onPress={onShare}
        />
      </View>

      <ChallengesSection event={event} checkedIn={checkedIn} />

      <QrScanner
        visible={scannerVisible}
        title="Scan the event QR code"
        onScan={onScanned}
        onClose={() => setScannerVisible(false)}
      />
    </ScrollView>
  );
}

/** Centered loading/error/not-found card shared by the states above. */
function StateCard({
  title,
  body,
  retryLabel,
  onRetry,
  theme,
}: {
  title: string;
  body: string;
  retryLabel?: string;
  onRetry?: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.stateContainer, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.stateCard,
          { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
        ]}
        accessibilityRole={retryLabel ? 'alert' : 'text'}
      >
        <ThemedText type="smallBold" style={styles.stateTitle}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.stateBody}>
          {body}
        </ThemedText>
        {retryLabel && onRetry ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
            style={({ pressed }) => [
              styles.stateButton,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ThemedText type="smallBold">{retryLabel}</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.six,
  },
  hero: {
    width: '100%',
    height: 220,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.one,
  },
  metaText: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.four,
    marginBottom: Spacing.one,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  menuTexts: {
    flex: 1,
    gap: 2,
  },
  description: {
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.four,
  },
  action: {
    flexGrow: 1,
    minWidth: 132,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  stateCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.two,
    maxWidth: 360,
    alignItems: 'center',
  },
  stateTitle: {
    textAlign: 'center',
    fontSize: 16,
  },
  stateBody: {
    textAlign: 'center',
  },
  stateButton: {
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
});
