import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Every animation in the app, and what it becomes when the person has asked
 * for less motion: Reduce Motion on iOS, Remove animations on Android,
 * prefers-reduced-motion on the web. One place to read and change.
 *
 * | What                         | Normally              | Reduced                    |
 * |------------------------------|-----------------------|----------------------------|
 * | Photos appearing             | 200 ms fade           | appear at once             |
 * | Map moving to a place        | 400 ms glide          | jumps there                |
 * | Map panel folding open/shut  | ease in-out           | snaps                      |
 * | Sheets, photo viewer         | fade                  | appear at once             |
 * | A challenge opening          | slide up              | appears at once            |
 * | Screen to screen (stacks)    | platform push         | no animation               |
 * | Switch knob                  | 160 ms slide          | jumps (Reanimated, System) |
 * | Splash logo                  | plays the animation   | last frame, then fades out |
 */
export const MOTION = {
  imageFadeMs: 200,
  mapMoveMs: 400,
  toggleMs: 160,
  sheet: 'fade',
  challenge: 'slide',
} as const;

/** The person's reduce-motion setting, kept up to date while the app runs. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (alive) setReduce(on);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  return reduce;
}

/** MOTION, with each value switched off when the person asked for less motion. */
export function useMotion() {
  const reduce = useReduceMotion();
  return {
    reduce,
    imageFadeMs: reduce ? 0 : MOTION.imageFadeMs,
    mapMoveMs: reduce ? 0 : MOTION.mapMoveMs,
    sheet: reduce ? ('none' as const) : MOTION.sheet,
    challenge: reduce ? ('none' as const) : MOTION.challenge,
    stack: reduce ? ('none' as const) : ('default' as const),
  };
}
