import type { Coordinates, PopUpEvent } from '@/types';
import { getEventPhase } from '@/utils/dateTime';
import { distanceInMeters } from '@/utils/distance';

/**
 * The pop-up to put first, and the next few after it. First is the nearest
 * one that's live (or the first live one, without your location), else the
 * next to start. Pop-ups that have ended are left out.
 */
export function featuredPopUps(
  events: PopUpEvent[],
  coordinates: Coordinates | null,
  now: Date = new Date(),
  upcomingCount = 3,
): { featured: PopUpEvent | undefined; upcoming: PopUpEvent[] } {
  const byStart = events
    .filter((event) => getEventPhase(event.startsAt, event.endsAt, now) !== 'ended')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const live = byStart.filter((event) => getEventPhase(event.startsAt, event.endsAt, now) === 'live');
  const nearestLive = coordinates
    ? [...live].sort(
        (a, b) => distanceInMeters(coordinates, a.coordinates) - distanceInMeters(coordinates, b.coordinates),
      )[0]
    : live[0];
  const featured = nearestLive ?? byStart[0];
  return { featured, upcoming: byStart.filter((event) => event.id !== featured?.id).slice(0, upcomingCount) };
}
