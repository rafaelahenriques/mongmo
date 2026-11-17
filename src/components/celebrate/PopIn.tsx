import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useCalm } from '@/components/celebrate/useCalm';

/**
 * Something that just happened arriving: it grows in with a small
 * overshoot and settles (about 400 ms). With less motion it's simply there.
 */
export function PopIn({
  children,
  delay = 0,
  from = 0.6,
  style,
}: {
  children: ReactNode;
  /** Wait this long first (ms), to follow something else. */
  delay?: number;
  /** The size it starts from. */
  from?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const calm = useCalm();
  const scale = useSharedValue(calm ? 1 : from);
  const opacity = useSharedValue(calm ? 1 : 0);

  useEffect(() => {
    if (calm) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    const reduceMotion = ReduceMotion.System;
    opacity.value = withDelay(delay, withTiming(1, { duration: 160, reduceMotion }));
    scale.value = withDelay(delay, withSpring(1, { damping: 9, stiffness: 170, mass: 0.8, reduceMotion }));
    // Plays once, when it first shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
