import { Platform } from 'react-native';

/**
 * The spoken name of a control whose visible text already says what it is:
 * a card, a row, a button with a price.
 *
 * - iOS and Android: `label`, phrased to be heard ("10,50 euro" rather
 *   than "10,50") and starting with the visible words, so Voice Control's
 *   "Tap Checkout" works.
 * - Web: no separate label. The name is the visible text itself, so it
 *   always contains what's on screen (WCAG 2.5.3 Label in Name), which a
 *   separate label can't guarantee there: text on separate lines runs
 *   together when browsers and checkers compare them.
 */
export function nameFromContent(label: string): { accessibilityLabel?: string } {
  return Platform.OS === 'web' ? {} : { accessibilityLabel: label };
}
