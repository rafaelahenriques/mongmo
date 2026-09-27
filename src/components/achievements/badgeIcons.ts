import type { IconName } from '@/components/ui/Icon';

/**
 * Each badge's symbol, by its stable server key. A badge added on the
 * server before an app update simply gets the generic rosette.
 */
const BADGE_ICONS: Record<string, IconName> = {
  'first-sip': 'sparkles',
  'popup-scout': 'compass',
  'street-food-fan': 'takeout',
  'local-legend': 'trophy',
  'memory-maker': 'camera',
  'first-order': 'coffee',
  regular: 'repeat',
  'event-eater': 'food',
  'city-hopper': 'pin',
  'event-hopper': 'ticket',
  shutterbug: 'photo',
  'taste-tester': 'star',
  'challenge-champion': 'medal',
};

export function badgeIcon(key: string | undefined): IconName {
  return (key && BADGE_ICONS[key]) || 'award';
}
