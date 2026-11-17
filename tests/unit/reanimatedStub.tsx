/**
 * Reanimated for unit tests: what the celebrations use, with every
 * animation landing at once on its end value. The library's own mock
 * starts native parts Jest doesn't have.
 */
import { View } from 'react-native';

const toEnd = (value: unknown) => value;

export const ReduceMotion = { System: 'system', Always: 'always', Never: 'never' } as const;
export const Easing = {
  out: (easing: (t: number) => number) => easing,
  cubic: (t: number) => t,
  bezier: () => (t: number) => t,
};
export const useSharedValue = <T,>(value: T) => ({ value });
export const useAnimatedStyle = (style: () => object) => style();
export const useReducedMotion = () => false;
export const withTiming = toEnd;
export const withSpring = toEnd;
export const withDelay = (_delay: number, value: unknown) => value;
export const ReducedMotionConfig = () => null;
export type SharedValue<T> = { value: T };

const Animated = { View };
export default Animated;
