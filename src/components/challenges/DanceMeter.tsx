import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ChallengeFrame } from '@/components/challenges/ChallengeFrame';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { checkMotion, requestMotionAccess, watchMotion, type MotionSubscription } from '@/services/motion';
import { UPDATE_APP_MESSAGE } from '@/services/nativeModules';
import { addDanceReading, DANCE_START, type DanceProgress } from '@/utils/danceMeter';

export type DanceMeterProps = {
  /** The challenge's name, in the top bar. */
  title: string;
  points: number;
  /** Seconds of movement that fill the meter. */
  seconds: number;
  /** Completing; the Send block spins meanwhile. */
  sending: boolean;
  onDone: (activeSeconds: number) => void;
  onClose: () => void;
};

const SAMPLE_MS = 100;
/** No reading this long after starting means there's no sensor to read. */
const SILENCE_MS = 3000;
const NO_SENSOR = 'This device has no motion sensor. Try it on your phone.';
const HOW = 'Dance with your phone in your hand. Only real movement counts, so the meter stops when you do.';

const RING = 200;
const STROKE = 16;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Status = 'checking' | 'ready' | 'dancing' | 'paused' | 'done' | 'unavailable';

/**
 * X-03 Dance challenge: a sage ring fills while the phone is moving (read
 * from its motion sensor), with the seconds danced in the middle; standing
 * still stops it, PAUSE holds it. Only the total is sent — the server
 * checks it covers the challenge's time. Mounted only while open, so every
 * attempt starts from zero.
 */
export default function DanceMeter({ title, points, seconds, sending, onDone, onClose }: DanceMeterProps) {
  const theme = useTheme();
  const [status, setStatus] = useState<Status>('checking');
  const [unavailableReason, setUnavailableReason] = useState('');
  const [activeMs, setActiveMs] = useState(0);
  const progress = useRef<DanceProgress>(DANCE_START);
  const subscription = useRef<MotionSubscription | null>(null);
  const silence = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closed = useRef(false);
  const targetMs = seconds * 1000;

  useEffect(() => {
    closed.current = false;
    checkMotion().then((availability) => {
      if (closed.current) return;
      if (availability === 'available') {
        setStatus('ready');
        return;
      }
      setUnavailableReason(availability === 'needs-update' ? UPDATE_APP_MESSAGE : NO_SENSOR);
      setStatus('unavailable');
    });
    return () => {
      closed.current = true;
      subscription.current?.remove();
      if (silence.current) clearTimeout(silence.current);
    };
  }, []);

  const stopWatching = () => {
    subscription.current?.remove();
    subscription.current = null;
    if (silence.current) clearTimeout(silence.current);
    silence.current = null;
  };

  const dance = async () => {
    // First, while still inside the tap: Safari only asks from one.
    if (!(await requestMotionAccess())) {
      setUnavailableReason('Motion access is off. Allow it in your browser settings to dance.');
      setStatus('unavailable');
      return;
    }
    haptics.press();
    setStatus('dancing');
    // A pause isn't dancing: start timing afresh from the next reading.
    progress.current = { ...progress.current, lastReadingAt: null, lastMoveAt: null };

    let gaveUp = false;
    silence.current = setTimeout(() => {
      gaveUp = true;
      stopWatching();
      setUnavailableReason(NO_SENSOR);
      setStatus('unavailable');
    }, SILENCE_MS);
    const watching = await watchMotion((force) => {
      if (silence.current) {
        clearTimeout(silence.current);
        silence.current = null;
      }
      const before = progress.current.activeMs;
      progress.current = addDanceReading(progress.current, force, Date.now());
      const total = progress.current.activeMs;
      if (total === before) return;
      // A little tick every ten seconds of dancing.
      if (Math.floor(total / 10000) > Math.floor(before / 10000)) haptics.select();
      setActiveMs(Math.min(total, targetMs));
      if (total >= targetMs) {
        stopWatching();
        haptics.success();
        setStatus('done');
      }
    }, SAMPLE_MS);
    if (closed.current || gaveUp) watching.remove();
    else subscription.current = watching;
  };

  const pause = () => {
    stopWatching();
    setStatus('paused');
  };

  const shown = Math.floor(activeMs / 1000);
  const share = Math.min(1, activeMs / targetMs);

  const heading = {
    checking: 'Keep moving',
    ready: 'Ready to dance?',
    dancing: 'Keep moving',
    paused: 'Paused',
    done: 'Nice moves',
    unavailable: 'No dance floor here',
  }[status];

  const action =
    status === 'ready'
      ? { label: 'Start dancing', onPress: dance }
      : status === 'dancing'
        ? { label: 'Pause', tone: 'dark' as const, arrow: false, haptic: 'tap' as const, onPress: pause }
        : status === 'paused'
          ? { label: 'Keep dancing', onPress: dance }
          : status === 'done'
            ? { label: 'Send', value: `+${points}`, loading: sending, onPress: () => onDone(shown) }
            : status === 'unavailable'
              ? { label: 'Close', tone: 'dark' as const, arrow: false, onPress: onClose }
              : null;

  return (
    <ChallengeFrame title={title} points={points} action={action} onClose={onClose}>
      <View style={styles.center}>
        <ThemedText type="title" accessibilityRole="header" style={styles.heading}>
          {heading}
        </ThemedText>

        <View
          style={styles.ring}
          accessible
          accessibilityLabel={`${shown} of ${seconds} seconds danced`}
          accessibilityLiveRegion="polite"
        >
          <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              stroke={theme.backgroundSelected}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              stroke={theme.brand}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={CIRCUMFERENCE * (1 - share)}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          {status === 'checking' ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <>
              <ThemedText type="display">{shown}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                of {seconds} seconds
              </ThemedText>
            </>
          )}
        </View>

        <ThemedText type="default" themeColor="textSecondary" style={styles.how}>
          {status === 'unavailable' ? unavailableReason : HOW}
        </ThemedText>
      </View>
    </ChallengeFrame>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 28,
    paddingTop: 18,
  },
  heading: {
    fontSize: 40,
    lineHeight: 44,
    textAlign: 'center',
  },
  ring: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  how: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
