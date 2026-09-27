import type { OwnerEventSummary } from '@/api/owner';
import type { ChipProps } from '@/components/ui/Chip';
import { getEventPhase } from '@/utils/dateTime';

export type OwnerEventGroup = 'live' | 'upcoming' | 'past' | 'cancelled';

/**
 * Where an event belongs on the owner's list. Uses the clock, not the
 * stored `status` (nothing flips 'scheduled' to 'live' on time), except that
 * a cancelled event is always cancelled.
 */
export function ownerEventGroup(event: OwnerEventSummary, now: Date = new Date()): OwnerEventGroup {
  if (event.status === 'cancelled') return 'cancelled';
  if (event.status === 'ended') return 'past';
  const phase = getEventPhase(event.startsAt, event.endsAt, now);
  return phase === 'ended' ? 'past' : phase;
}

export const OWNER_GROUP_LABEL: Record<OwnerEventGroup, string> = {
  live: 'Live now',
  upcoming: 'Upcoming',
  past: 'Past',
  cancelled: 'Cancelled',
};

export const OWNER_GROUP_TONE: Record<OwnerEventGroup, NonNullable<ChipProps['tone']>> = {
  live: 'live',
  upcoming: 'info',
  past: 'neutral',
  cancelled: 'danger',
};
