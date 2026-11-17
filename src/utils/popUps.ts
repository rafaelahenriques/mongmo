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

/** A pop-up takes orders from this many hours before it starts (the server agrees: 0044). */
export const PREORDER_HOURS = 24;

/**
 * Whether a pop-up takes orders: while it's on ('open'), in the 24 hours
 * before it starts ('preorder', for a time during it), not yet ('later'),
 * or not any more ('ended').
 */
export type OrderWindow = 'open' | 'preorder' | 'later' | 'ended';

export function orderWindow(event: Pick<PopUpEvent, 'startsAt' | 'endsAt'>, now: Date = new Date()): OrderWindow {
  const phase = getEventPhase(event.startsAt, event.endsAt, now);
  if (phase !== 'upcoming') return phase === 'live' ? 'open' : 'ended';
  return now.getTime() >= preordersOpenAt(event).getTime() ? 'preorder' : 'later';
}

/** When a pop-up starts taking pre-orders. */
export function preordersOpenAt(event: Pick<PopUpEvent, 'startsAt'>): Date {
  return new Date(Date.parse(event.startsAt) - PREORDER_HOURS * 60 * 60 * 1000);
}

/** Whether a pop-up takes orders right now: while it's on, or in the 24 hours before. */
export function takesOrders(event: Pick<PopUpEvent, 'startsAt' | 'endsAt'>, now: Date = new Date()): boolean {
  const when = orderWindow(event, now);
  return when === 'open' || when === 'preorder';
}
