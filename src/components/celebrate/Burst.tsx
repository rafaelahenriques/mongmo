import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useCalm } from '@/components/celebrate/useCalm';

/** How long the dots fly (ms): a short burst, not a show. */
const BURST_MS = 650;

/**
 * A short burst of dots flying out from the middle of what it's laid over,
 * then fading: "that worked". Decorative and out of the way (no touches, no
 * screen reader). With less motion there's no burst at all.
 */
export function Burst({
  colors,
  count = 12,
  distance = 110,
  delay = 0,
  style,
}: {
  /** The dots' colours, used in turn. */
  colors: string[];
  count?: number;
  /** How far the dots fly (pt). */
  distance?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const calm = useCalm();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (calm) return;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: BURST_MS, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }),
    );
    // Plays once, when it first shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (calm) return null;
  return (
    <View
      pointerEvents="none"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.center, style]}
    >
      {Array.from({ length: count }, (_, index) => (
        <Dot
          key={index}
          progress={progress}
          // Evenly round, each a little off so it doesn't look drawn with a compass.
          angle={(index / count) * Math.PI * 2 + (index % 2 ? 0.18 : -0.1)}
          reach={distance * (index % 3 === 0 ? 1 : index % 3 === 1 ? 0.78 : 0.9)}
          color={colors[index % colors.length]}
          size={index % 2 ? 9 : 12}
          round={index % 3 !== 2}
        />
      ))}
    </View>
  );
}

function Dot({
  progress,
  angle,
  reach,
  color,
  size,
  round,
}: {
  progress: SharedValue<number>;
  angle: number;
  reach: number;
  color: string;
  size: number;
  round: boolean;
}) {
  const animated = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t === 0 ? 0 : 1 - t * t,
      transform: [
        { translateX: Math.cos(angle) * reach * t },
        { translateY: Math.sin(angle) * reach * t },
        { scale: 0.4 + Math.min(t * 3, 1) * 0.6 },
        { rotate: `${t * 160}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.dot,
        { width: size, height: round ? size : size * 0.5, borderRadius: round ? size : 2, backgroundColor: color },
        animated,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
});
