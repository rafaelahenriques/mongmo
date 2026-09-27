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
  'night-owl': 'moon',
  'city-hopper': 'map',
  shutterbug: 'photo',
  'food-critic': 'star',
  'dance-machine': 'dance',
  'crowd-voice': 'people',
  'early-bird': 'sunrise',
  'challenge-champion': 'medal',
};

export function badgeIcon(key: string | undefined): IconName {
  return (key && BADGE_ICONS[key]) || 'award';
}
