import type { IconName } from '@/components/ui/Icon';
import type { ChallengeType } from '@/types/database';

/** The symbol for each challenge type, shared by customers and owners. */
export const CHALLENGE_ICON: Record<ChallengeType, IconName> = {
  explore: 'compass',
  check_in: 'qrcode',
  capture: 'camera',
  taste: 'food',
  social: 'share',
  timing: 'timer',
  collection: 'layers',
  discovery: 'search',
  streak: 'flame',
  community: 'people',
};
