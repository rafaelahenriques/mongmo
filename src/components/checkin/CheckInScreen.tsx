import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { formatInTimeZone } from 'date-fns-tz';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapSketch } from '@/components/map/MapSketch';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { Button } from '@/components/ui/Button';
import { TaskCard } from '@/components/ui/TaskCard';
import { TopBar } from '@/components/ui/TopBar';
import { GEOFENCE_RADIUS_M } from '@/constants/config';
import { PageInset, Radius } from '@/constants/theme';
import { useChallenges } from '@/hooks/useChallenges';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useCheckInMutation } from '@/hooks/useCheckInMutation';
import { useEvent } from '@/hooks/useEvent';
import { useNow } from '@/hooks/useNow';
import { useTheme } from '@/hooks/useTheme';
import { openDirections } from '@/services/directions';
import { haptics } from '@/services/haptics';
import { getCurrentPlace } from '@/services/location';
import { switchPickup } from '@/services/switchPickup';
import { useLocationStore } from '@/state/locationStore';
import { getEventPhase } from '@/utils/dateTime';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import type { PopUpEvent } from '@/types';

/** Why a check-in can't go through, each with its own message on K-04. */
type Failure = 'far' | 'closed' | 'code' | 'location' | 'other';

/** Maps the server's verify_check_in errors onto the screens we show. */
function failureFor(message: string): Failure {
  if (/at the venue|away/i.test(message)) return 'far';
  if (/not currently running|not found/i.test(message)) return 'closed';
  if (/QR code/i.test(message)) return 'code';
  return 'other';
}

/**
 * Check-in for a live pop-up, in three screens: scan the code at the
 * counter (K-02, with the location shown first so people know why it
 * might fail), "You're in." (K-03), or "Almost there" (K-04) when the
 * location, the time or the code doesn't match.
 */
export default function CheckInScreen({ eventId }: { eventId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const event = useEvent(eventId).data;
  const existing = useCheckIn(eventId);
  const coordinates = useLocationStore((state) => state.coordinates);
  const mutation = useCheckInMutation(eventId);
  const now = useNow();
  const [result, setResult] = useState<{ done: true; at: Date } | { failure: Failure; message?: string } | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(popups)'));

  const onScan = useCallback(
    (qrToken: string) => {
      if (!coordinates) {
        haptics.warning();
        setResult({ failure: 'location' });
        return;
      }
      mutation.mutate(
        { qrToken, coordinates },
        {
          onSuccess: () => {
            haptics.success();
            AccessibilityInfo.announceForAccessibility('Checked in. Points added.');
            setResult({ done: true, at: new Date() });
          },
          onError: (error) => {
            haptics.error();
            const message = error instanceof Error ? error.message : '';
            if (/already checked in/i.test(message)) setResult({ done: true, at: new Date() });
            else setResult({ failure: failureFor(message), message });
          },
        },
      );
    },
    [coordinates, mutation],
  );

  if (!event) {
    return (
      <View style={[styles.center, { backgroundColor: theme.surfaceDark }]}>
        <ActivityIndicator color={theme.onSurfaceDark} />
      </View>
    );
  }

  const distance = coordinates ? distanceInMeters(coordinates, event.coordinates) : null;
  // Before the camera opens: the same checks the server makes, so a scan
  // isn't wasted on a pop-up that has closed or from too far away.
  const precheck: Failure | null =
    getEventPhase(event.startsAt, event.endsAt, now) !== 'live'
      ? 'closed'
      : distance !== null && distance > GEOFENCE_RADIUS_M
        ? 'far'
        : null;

  if (result && 'done' in result) {
    return <CheckedIn event={event} at={result.at} />;
  }
  if (existing.data && !result) {
    return <CheckedIn event={event} at={new Date(existing.data.checked_in_at)} />;
  }
  const failure = result && 'failure' in result ? result.failure : precheck;
  if (failure) {
    return (
      <AlmostThere
        event={event}
        failure={failure}
        distance={distance}
        message={result && 'message' in result ? result.message : undefined}
        onBack={close}
        onTryAgain={async () => {
          setResult(null);
          try {
            const place = await getCurrentPlace();
            useLocationStore.getState().setCoordinates({ latitude: place.latitude, longitude: place.longitude });
          } catch {
            // Keep the last known position.
          }
        }}
      />
    );
  }
  return <Scan event={event} distance={distance} pending={mutation.isPending} onScan={onScan} onClose={close} />;
}

/** K-02: dark screen, camera with sage corners, location first. */
function Scan({
  event,
  distance,
  pending,
  onScan,
  onClose,
}: {
  event: PopUpEvent;
  distance: number | null;
  pending: boolean;
  onScan: (token: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);
  const camera = Platform.OS !== 'web' && permission?.granted;

  return (
    <View style={[styles.screen, { backgroundColor: theme.surfaceDark, paddingBottom: insets.bottom + 12 }]}>
      <TopBar title="Check in" onBack={onClose} backIcon="close" inverse />
      <View style={styles.scanBody}>
        <ThemedText type="title" style={{ color: theme.onSurfaceDark }} accessibilityRole="header">
          Scan the code at the counter
        </ThemedText>
        <View style={[styles.viewfinder, { backgroundColor: theme.textSecondary }]}>
          {camera ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={(scan) => {
                if (scanned.current || pending) return;
                scanned.current = true;
                haptics.press();
                onScan(scan.data);
              }}
            />
          ) : (
            <View style={styles.cameraNote}>
              <ThemedText type="captionBold" style={{ color: theme.onSurfaceDark, textAlign: 'center' }}>
                {Platform.OS === 'web'
                  ? 'Scanning works in the app on your phone.'
                  : 'Mongmo needs the camera to read the code.'}
              </ThemedText>
              {Platform.OS !== 'web' ? (
                <Button label="Allow camera" variant="brand" size="small" onPress={requestPermission} />
              ) : null}
            </View>
          )}
          <Corners color={theme.brand} />
          {pending ? (
            <View style={[StyleSheet.absoluteFill, styles.center]}>
              <ActivityIndicator color={theme.onSurfaceDark} size="large" />
            </View>
          ) : null}
        </View>
        <TaskCard
          icon="pin"
          title={distance !== null ? 'Location found' : 'Finding you'}
          subtitle={
            distance !== null
              ? `${formatDistance(distance)} from the venue`
              : 'Turn on location so we can confirm you’re there'
          }
          state={distance !== null ? 'done' : 'plain'}
        />
        <ThemedText type="captionBold" style={[styles.help, { color: theme.onSurfaceDark }]}>
          Can’t scan? Ask the team at the counter.
        </ThemedText>
      </View>
    </View>
  );
}

/** The four sage corner brackets of the viewfinder. */
function Corners({ color }: { color: string }) {
  const corner = { position: 'absolute' as const, width: 50, height: 50, borderColor: color };
  return (
    <View style={styles.corners} pointerEvents="none">
      <View style={[corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
      <View style={[corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
      <View style={[corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
      <View style={[corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
    </View>
  );
}

/** K-03: full sage, heavy title, the pop-up's photo, a dark button. */
function CheckedIn({ event, at }: { event: PopUpEvent; at: Date }) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { challenges } = useChallenges(event.id);
  const points = challenges.find((challenge) => challenge.type === 'check_in')?.points;
  const time = formatInTimeZone(at, event.timeZone, 'H:mm');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.brandFill }}
      contentContainerStyle={[styles.done, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}
    >
      <ThemedText type="display" style={[styles.doneTitle, { color: theme.onBrand }]} accessibilityRole="header">
        You&apos;re in.
      </ThemedText>
      {event.imageUrl ? (
        <Image
          accessible={false}
          accessibilityLabel=""
          source={{ uri: event.imageUrl }}
          style={styles.donePhoto}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.donePhoto, { backgroundColor: theme.onBrand, opacity: 0.12 }]} />
      )}
      <ThemedText type="smallBold" style={[styles.doneText, { color: theme.onBrand }]}>
        {event.title}, checked in at {time}.{points ? ` You earned ${points} points.` : ''}
      </ThemedText>
      <View style={styles.doneActions}>
        <Button
          label="See challenges"
          variant="primary"
          onPress={() => router.replace({ pathname: '/(popups)/challenges/[id]', params: { id: event.id } })}
        />
        <Pressable
          onPress={async () => {
            haptics.tap();
            if (await switchPickup({ type: 'event', eventId: event.id, eventTitle: event.title })) {
              router.replace('/(orders)');
            }
          }}
          accessibilityRole="button"
          hitSlop={10}
          style={styles.textButton}
        >
          <ThemedText type="smallBold" style={{ color: theme.onBrand }}>
            Order ahead
          </ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/** K-04: what went wrong, a map with the way there, try again or directions. */
function AlmostThere({
  event,
  failure,
  distance,
  message,
  onBack,
  onTryAgain,
}: {
  event: PopUpEvent;
  failure: Failure;
  distance: number | null;
  message?: string;
  onBack: () => void;
  onTryAgain: () => void;
}) {
  const theme = useTheme();
  const copy = {
    far: {
      title: 'Almost there',
      body: `You're ${distance !== null ? formatDistance(distance) : 'too far'} from ${event.title}. Get a little closer and try again.`,
    },
    closed: { title: 'This pop-up has closed', body: `${event.title} isn't taking check-ins right now.` },
    code: { title: "We don't recognise this code", body: `Scan the code at the ${event.title} counter.` },
    location: { title: 'Where are you?', body: 'Turn on location so we can confirm you’re at the venue.' },
    other: { title: 'That didn’t work', body: message || 'Please try again.' },
  }[failure];

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TopBar title="Check in" onBack={onBack} />
      <View style={styles.failBody}>
        <ThemedText type="name" accessibilityRole="header">
          {copy.title}
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.failText}>
          {copy.body}
        </ThemedText>
        <MapSketch route style={styles.failMap} />
        <Button label="Try again" variant="ghost" onPress={onTryAgain} />
      </View>
      <BlockButton
        label="Directions"
        onPress={() => openDirections(event.coordinates, `${event.title}, ${event.venue}`)}
        bottomInset
        haptic="tap"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBody: {
    flex: 1,
    paddingHorizontal: PageInset,
    gap: 14,
  },
  viewfinder: {
    flex: 1,
    overflow: 'hidden',
  },
  corners: {
    position: 'absolute',
    top: '28%',
    bottom: '28%',
    left: '18%',
    right: '18%',
  },
  cameraNote: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  help: {
    textAlign: 'center',
  },
  done: {
    paddingHorizontal: PageInset + 4,
    gap: 18,
    flexGrow: 1,
  },
  doneTitle: {
    fontSize: 56,
    lineHeight: 60,
  },
  donePhoto: {
    width: '100%',
    aspectRatio: 342 / 400,
    borderRadius: Radius.medium,
  },
  doneText: {
    fontSize: 15,
    lineHeight: 22,
  },
  doneActions: {
    marginTop: 'auto',
    gap: 8,
  },
  textButton: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  failBody: {
    flex: 1,
    paddingHorizontal: PageInset,
    gap: 14,
  },
  failText: {
    fontSize: 15,
    lineHeight: 22,
  },
  failMap: {
    flex: 1,
  },
});
