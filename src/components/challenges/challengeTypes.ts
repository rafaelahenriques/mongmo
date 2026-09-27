import type { IconName } from '@/components/ui/Icon';
import type { ChallengeType } from '@/types/database';

/** How each challenge type is named and shown, to customers and owners alike. */
export const CHALLENGE_TYPES: Record<ChallengeType, { label: string; icon: IconName; hint: string }> = {
  check_in: { label: 'Check-in', icon: 'qrcode', hint: 'Done the moment they scan in.' },
  capture: { label: 'Photo', icon: 'camera', hint: 'Take one or more photos of something.' },
  discovery: { label: 'Discovery', icon: 'search', hint: 'Find something hidden and photograph it.' },
  taste: { label: 'Taste', icon: 'food', hint: 'Rate a dish from 1 to 5.' },
  community: { label: 'Vote', icon: 'people', hint: 'Pick one of your options.' },
  motion: { label: 'Dance', icon: 'dance', hint: 'Keep the phone moving to fill a dance meter — made for DJ nights.' },
  timing: { label: 'Timing', icon: 'timer', hint: 'Only counts inside a time window.' },
  collection: { label: 'Collection', icon: 'layers', hint: 'Order several different dishes here.' },
  streak: { label: 'Streak', icon: 'flame', hint: 'Visit a number of Mongmo pop-ups.' },
  explore: { label: 'Explore', icon: 'compass', hint: 'Be at the venue.' },
  social: { label: 'Social', icon: 'share', hint: 'Share the pop-up with a friend.' },
};

/** The order owners see them in: most used first. */
export const CHALLENGE_TYPE_ORDER = Object.keys(CHALLENGE_TYPES) as ChallengeType[];
