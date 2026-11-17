import { useReducedMotion } from 'react-native-reanimated';

import { useReduceMotion } from '@/constants/motion';

/**
 * Whether to keep celebrations still: the person asked for less motion.
 * Reanimated's answer is ready at once (read at start-up); ours follows the
 * setting while the app runs.
 */
export function useCalm(): boolean {
  const atStart = useReducedMotion();
  const now = useReduceMotion();
  return atStart || now;
}
