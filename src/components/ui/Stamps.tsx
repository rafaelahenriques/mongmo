import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useIsFocused } from 'expo-router';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Burst } from '@/components/celebrate/Burst';
import { useCalm } from '@/components/celebrate/useCalm';
import { Stickers } from '@/constants/stickers';
import { Paper } from '@/constants/theme';
import { useSettingsHydrated } from '@/hooks/useSettingsHydrated';
import { useTheme } from '@/hooks/useTheme';
import { Sticker } from '@/components/ui/Sticker';
import { useSettingsStore } from '@/state/settingsStore';

/** The first new stamp waits for the screen to settle (ms); each after it follows this much later. */
const LAND_DELAY_MS = 350;
const LAND_STAGGER_MS = 180;

/** Each stamp lands a little crooked, as if pressed by hand. */
const TILT = [-8, 6, -3, 9, -6, 4, -9, 3, 7, -4];

/**
 * The stamp card: a slot per stamp. Each stamp earned is the Ô sticker; the
 * rest are dashed circles, and the next one fills its ring with the points
 * toward it. Ink stamps on a sage card (`onBrand`) or on the cream of a
 * stamp card (`onReward`). Decorative: say the count in text.
 */
export function StampRow({
  earned,
  total = 6,
  partial = 0,
  onBrand = false,
  onReward = false,
  freshFrom,
  style,
}: {
  earned: number;
  total?: number;
  /** How far the next stamp has filled, 0 to 1. */
  partial?: number;
  /** On a sage card: ink stamps, paper slots. */
  onBrand?: boolean;
  /** On a cream stamp card: ink stamps, soft brown slots. */
  onReward?: boolean;
  /** Stamps from this one on are new: they land, one after another. */
  freshFrom?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const filled = Math.max(0, Math.min(total, Math.round(earned)));
  const fill = Math.max(0, Math.min(1, partial));
  const slot = onBrand ? Paper : onReward ? theme.onRewardSoft : theme.outline;
  const ring = onBrand ? theme.onBrand : onReward ? theme.onReward : theme.primaryText;

  return (
    <View style={[styles.row, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: total }, (_, index) => (
        <View key={index} style={styles.slot}>
          {index < filled ? (
            <Landing
              fresh={freshFrom !== undefined && index >= freshFrom}
              delay={LAND_DELAY_MS + (index - (freshFrom ?? 0)) * LAND_STAGGER_MS}
              tilt={TILT[index % TILT.length]}
              burst={[theme.brand, theme.text, theme.tertiary]}
            >
              <Sticker source={onBrand || onReward ? Stickers.oMarkInk : Stickers.oMark} style={styles.stamp} />
            </Landing>
          ) : (
            <View style={[styles.empty, { borderColor: slot }]}>
              {index === filled && fill > 0 ? <ProgressRing fill={fill} color={ring} /> : null}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

/**
 * The stamp card where stamps are earned (Home, Wallet): a stamp earned
 * since the card was last on screen lands on it, pressed down like a
 * rubber stamp with a small burst, the next time the card is showing.
 */
export function LiveStampRow(props: Omit<Parameters<typeof StampRow>[0], 'freshFrom'>) {
  const filled = Math.max(0, Math.min(props.total ?? 6, Math.round(props.earned)));
  const focused = useIsFocused();
  const hydrated = useSettingsHydrated();
  const seen = useSettingsStore((state) => state.stampsSeen);
  /** Where the new stamps start, for as long as this card is up. */
  const [freshFrom, setFreshFrom] = useState<number | undefined>(undefined);
  const arriving = focused && hydrated && seen !== null && filled > seen ? seen : undefined;
  if (arriving !== undefined && freshFrom === undefined) setFreshFrom(arriving);

  useEffect(() => {
    if (!focused || !hydrated || seen === filled) return;
    // The first card ever shown, or a reward spent: nothing to land, just remember.
    useSettingsStore.getState().setStampsSeen(filled);
  }, [focused, hydrated, seen, filled]);

  return <StampRow {...props} freshFrom={freshFrom} />;
}

/** A stamp: tilted as if pressed by hand; a new one presses down from above. */
function Landing({
  fresh,
  delay,
  tilt,
  burst,
  children,
}: {
  fresh: boolean;
  delay: number;
  tilt: number;
  burst: string[];
  children: ReactNode;
}) {
  const calm = useCalm();
  const play = fresh && !calm;
  const scale = useSharedValue(play ? 1.9 : 1);
  const opacity = useSharedValue(play ? 0 : 1);
  const turn = useSharedValue(play ? tilt + 24 : tilt);

  useEffect(() => {
    if (!play) return;
    const reduceMotion = ReduceMotion.System;
    opacity.value = withDelay(delay, withTiming(1, { duration: 120, reduceMotion }));
    scale.value = withDelay(delay, withSpring(1, { damping: 11, stiffness: 260, mass: 0.7, reduceMotion }));
    turn.value = withDelay(delay, withSpring(tilt, { damping: 12, stiffness: 200, reduceMotion }));
    // Lands once, when it first shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${turn.value}deg` }],
  }));
  return (
    <View style={styles.fill}>
      {play ? <Burst colors={burst} count={8} distance={44} delay={delay + 80} /> : null}
      <Animated.View style={[styles.fill, animated]}>{children}</Animated.View>
    </View>
  );
}

/** The next stamp's ring, drawn round from the top as its points come in. */
function ProgressRing({ fill, color }: { fill: number; color: string }) {
  const size = 100;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  return (
    <Svg viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${length} ${length}`}
        strokeDashoffset={length * (1 - fill)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  // Up to 52 pt each; ten still fit a phone's width, smaller.
  slot: {
    flex: 1,
    maxWidth: 52,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: {
    width: '100%',
    height: '100%',
  },
  fill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    width: '84%',
    height: '84%',
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
});
