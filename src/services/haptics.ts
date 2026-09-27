import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * One place for haptic feedback, so every interaction of a kind feels the
 * same. No-ops on web, and never throws (haptics are a nicety, never a
 * reason for an action to fail).
 */
const run = (feedback: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  feedback().catch(() => undefined);
};

export const haptics = {
  /** A button or card press. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Something weightier: add to cart, advance an order, open the scanner. */
  press: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Picking an option: segments, chips, toggles, stars. */
  select: () => run(() => Haptics.selectionAsync()),
  /** It worked: checked in, order placed, challenge done, badge earned. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Careful: destructive confirmations. */
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** It failed: check-in refused, order error. */
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
