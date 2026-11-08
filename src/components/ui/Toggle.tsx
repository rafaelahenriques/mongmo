import { Pressable, StyleSheet } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { MOTION } from '@/constants/motion';

const WIDTH = 46;
const HEIGHT = 26;
const KNOB = 20;
const TRAVEL = WIDTH - KNOB - 6;

/**
 * The app's switch, drawn to the design: sage track with a dark knob when
 * on, stone track with a light knob when off. A selection tick of haptics
 * on change. Reads as a switch to screen readers.
 */
export function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const knob = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(value ? TRAVEL : 0, { duration: MOTION.toggleMs, reduceMotion: ReduceMotion.System }) },
    ],
  }));

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onValueChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      aria-checked={value}
      aria-disabled={disabled}
      disabled={disabled}
      hitSlop={8}
      style={[styles.track, { backgroundColor: value ? theme.brandFill : theme.outline, opacity: disabled ? 0.5 : 1 }]}
    >
      <Animated.View
        style={[styles.knob, { backgroundColor: value ? theme.onBrand : theme.backgroundElement }, knob]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    padding: 3,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
  },
});
