import { addDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import type { WeeklyHours } from '@/types';
import { getCurrentWeekday } from '@/utils/dateTime';

const QUARTER = 15 * 60_000;
/** The soonest pickup: a quarter of an hour to make it. */
const LEAD = 15 * 60_000;

export type PickupDay = 'today' | 'tomorrow';

/** Where the pickup is: a place with weekly hours, or a pop-up's window. */
export type PickupPlace =
  | { kind: 'store'; hours: WeeklyHours; timeZone: string }
  | { kind: 'event'; startsAt: string; endsAt: string; timeZone: string };

/**
 * Pickup times every quarter of an hour while the place is open on that
 * day, from a quarter of an hour from now at the earliest, up to a quarter
 * before it closes. A pop-up only takes orders for today.
 */
export function pickupSlots(place: PickupPlace, day: PickupDay, now: Date = new Date()): Date[] {
  const date = day === 'today' ? now : addDays(now, 1);
  let open: number;
  let close: number;
  if (place.kind === 'store') {
    const hours = place.hours[getCurrentWeekday(place.timeZone, date)];
    if (!hours) return [];
    const ymd = formatInTimeZone(date, place.timeZone, 'yyyy-MM-dd');
    open = fromZonedTime(`${ymd}T${hours.open}:00`, place.timeZone).getTime();
    close = fromZonedTime(`${ymd}T${hours.close}:00`, place.timeZone).getTime();
  } else {
    if (day === 'tomorrow') return [];
    open = Date.parse(place.startsAt);
    close = Date.parse(place.endsAt);
  }
  const first = Math.ceil(Math.max(open, now.getTime() + LEAD) / QUARTER) * QUARTER;
  const slots: Date[] = [];
  for (let at = first; at <= close - QUARTER; at += QUARTER) slots.push(new Date(at));
  return slots;
}
