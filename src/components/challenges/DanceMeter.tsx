import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { haptics } from '@/services/haptics';
import { hasNativeFeature, UPDATE_APP_MESSAGE } from '@/services/nativeModules';

export type DanceMeterProps = {
  visible: boolean;
  title: string;
  /** Seconds of movement that fill the meter. */
  seconds: number;
  onDone: (activeSeconds: number) => void;
  onClose: () => void;
};

/** Acceleration (gravity removed) that counts as dancing, in m/s². */
const MOVING = 2.2;
const SAMPLE_MS = 100;

/** Always on dark: it's a dance floor, whatever the app's theme. */
const INK = '#FFFFFF';
const FLOOR = Colors.light.primary;
const RED = Colors.light.brandFill;

/**
 * The Motion challenge: a full-screen dance meter. While the phone is moving
 * (read from its motion sensor), seconds count up and the meter fills;
 * standing still pauses it. Only the total is sent — the server checks it
 * covers the challenge's time.
 */
export default function DanceMeter(props: DanceMeterProps) {
  // Mounted only while open, so every attempt starts from zero.
  return props.visible ? <DanceSession {...props} /> : null;
}

type Status = 'checking' | 'ready' | 'dancing' | 'done' | 'unavailable';

function DanceSession({ visible, title, seconds, onDone, onClose }: DanceMeterProps) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<Status>('checking');
  const [unavailableReason, setUnavailableReason] = useState('');
  const [activeMs, setActiveMs] = useState(0);
  const [energy, setEnergy] = useState(0);
  const subscription = useRef<{ remove: () => void } | null>(null);
  const targetMs = seconds * 1000;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasNativeFeature('motion')) {
        setUnavailableReason(UPDATE_APP_MESSAGE);
        setStatus('unavailable');
        return;
      }
      const { DeviceMotion } = await import('expo-sensors');
      const available = await DeviceMotion.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      if (!available) setUnavailableReason('This device has no motion sensor — try it on your phone.');
      setStatus(available ? 'ready' : 'unavailable');
    })();
    return () => {
      cancelled = true;
      subscription.current?.remove();
    };
  }, []);

  const start = async () => {
    const { DeviceMotion } = await import('expo-sensors');
    const permission = await DeviceMotion.requestPermissionsAsync().catch(() => null);
    if (permission && !permission.granted) {
      setUnavailableReason('Motion access is off for Mongmo — allow it in Settings to dance.');
      setStatus('unavailable');
      return;
    }
    haptics.press();
    setStatus('dancing');

    let total = 0;
    let smoothed = 0;
    DeviceMotion.setUpdateInterval(SAMPLE_MS);
    subscription.current = DeviceMotion.addListener(({ acceleration, interval }) => {
      if (!acceleration) return;
      const force = Math.hypot(acceleration.x, acceleration.y, acceleration.z);
      smoothed = smoothed * 0.75 + Math.min(1, force / 8) * 0.25;
      setEnergy(smoothed);
      if (force < MOVING) return;

      const before = total;
      total += interval || SAMPLE_MS;
      // A little tick every five seconds of dancing.
      if (Math.floor(total / 5000) > Math.floor(before / 5000)) haptics.select();
      setActiveMs(Math.min(total, targetMs));
      if (total >= targetMs) {
        subscription.current?.remove();
        subscription.current = null;
        haptics.success();
        setStatus('done');
      }
    });
  };

  const shown = Math.floor(activeMs / 1000);
  const progress = Math.min(1, activeMs / targetMs);
  const still = status === 'dancing' && energy < 0.2;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.floor, { paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.four }]}>
        <View style={styles.topBar}>
          <View style={styles.titlePill}>
            <ThemedText type="smallBold" style={styles.ink} numberOfLines={1}>
              {title}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => {
              haptics.tap();
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Close dance meter"
            hitSlop={12}
            style={styles.close}
          >
            <Icon name="close" size={20} color={INK} weight="bold" />
          </Pressable>
        </View>

        <View style={styles.center}>
          {/* The pulse grows with how hard you're moving. */}
          <View
            style={[styles.pulse, { transform: [{ scale: 0.7 + energy * 0.6 }], opacity: 0.25 + energy * 0.5 }]}
            importantForAccessibility="no"
          />
          <View
            style={styles.readout}
            accessible
            accessibilityLabel={`${shown} of ${seconds} seconds danced`}
            accessibilityLiveRegion="polite"
          >
            <ThemedText type="display" style={[styles.ink, styles.count]}>
              {shown}
            </ThemedText>
            <ThemedText type="smallBold" style={styles.dim}>
              of {seconds} seconds
            </ThemedText>
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.track} importantForAccessibility="no">
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>

          <ThemedText style={[styles.ink, styles.message]}>
            {status === 'checking'
              ? 'Getting the dance floor ready…'
              : status === 'ready'
                ? 'Hold your phone and dance. The meter fills while you move.'
                : status === 'dancing'
                  ? still
                    ? 'Move! The meter only fills while you dance.'
                    : 'Keep it going!'
                  : status === 'done'
                    ? 'Nice moves!'
                    : unavailableReason}
          </ThemedText>

          {status === 'checking' ? <ActivityIndicator color={INK} /> : null}
          {status === 'ready' ? (
            <Button label="Start dancing" variant="brand" icon="dance" haptic="none" onPress={start} />
          ) : null}
          {status === 'done' ? (
            <Button
              label="Claim points"
              variant="brand"
              icon="check"
              haptic="press"
              onPress={() => onDone(Math.floor(activeMs / 1000))}
            />
          ) : null}
          {status === 'unavailable' ? <Button label="Close" variant="secondary" onPress={onClose} /> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  floor: {
    flex: 1,
    backgroundColor: FLOOR,
    paddingHorizontal: Spacing.three + Spacing.one,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titlePill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: Radius.pill,
    backgroundColor: RED,
  },
  readout: {
    alignItems: 'center',
  },
  count: {
    fontSize: 120,
    lineHeight: 120,
  },
  bottom: {
    gap: Spacing.three,
  },
  track: {
    height: 14,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: RED,
  },
  message: {
    textAlign: 'center',
  },
  ink: {
    color: INK,
  },
  dim: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
});
