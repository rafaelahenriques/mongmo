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

/** How many days ahead the café takes orders for (today included). */
export const STORE_DAYS_AHEAD = 14;

/** Quarter-hour pickup times between open and close, a quarter of an hour from now at the earliest. */
function quarters(open: number, close: number, now: Date): Date[] {
  const first = Math.ceil(Math.max(open, now.getTime() + LEAD) / QUARTER) * QUARTER;
  const slots: Date[] = [];
  for (let at = first; at <= close - QUARTER; at += QUARTER) slots.push(new Date(at));
  return slots;
}

/** The café's pickup times on the day `ymd` (its own time zone). */
function storeSlotsOn(place: Extract<PickupPlace, { kind: 'store' }>, ymd: string, now: Date): Date[] {
  const noon = fromZonedTime(`${ymd}T12:00:00`, place.timeZone);
  const hours = place.hours[getCurrentWeekday(place.timeZone, noon)];
  if (!hours) return [];
  const open = fromZonedTime(`${ymd}T${hours.open}:00`, place.timeZone).getTime();
  const close = fromZonedTime(`${ymd}T${hours.close}:00`, place.timeZone).getTime();
  return quarters(open, close, now);
}

/**
 * Pickup times every quarter of an hour while the place is open on that
 * day, from a quarter of an hour from now at the earliest, up to a quarter
 * before it closes. A pop-up only takes orders for today.
 */
export function pickupSlots(place: PickupPlace, day: PickupDay, now: Date = new Date()): Date[] {
  if (place.kind === 'event') {
    if (day === 'tomorrow') return [];
    return quarters(Date.parse(place.startsAt), Date.parse(place.endsAt), now);
  }
  const ymd = formatInTimeZone(day === 'today' ? now : addDays(now, 1), place.timeZone, 'yyyy-MM-dd');
  return storeSlotsOn(place, ymd, now);
}

/** A day on the pickup calendar: its date (yyyy-MM-dd, the place's time zone) and its times. */
export type PickupCalendarDay = { ymd: string; slots: Date[] };

/**
 * Every day you could pick up on, for the calendar: the café's next two
 * weeks (closed days have no times), or the pop-up's remaining times split
 * by day (a night that runs past midnight spans two).
 */
export function pickupDays(place: PickupPlace, now: Date = new Date()): PickupCalendarDay[] {
  if (place.kind === 'event') {
    const byDay = new Map<string, Date[]>();
    for (const at of quarters(Date.parse(place.startsAt), Date.parse(place.endsAt), now)) {
      const ymd = formatInTimeZone(at, place.timeZone, 'yyyy-MM-dd');
      byDay.set(ymd, [...(byDay.get(ymd) ?? []), at]);
    }
    return [...byDay].map(([ymd, slots]) => ({ ymd, slots }));
  }
  // Step from noon to noon in the café's zone, so a clock change never skips a day.
  const start = fromZonedTime(`${formatInTimeZone(now, place.timeZone, 'yyyy-MM-dd')}T12:00:00`, place.timeZone);
  return Array.from({ length: STORE_DAYS_AHEAD }, (_, i) => {
    const ymd = formatInTimeZone(addDays(start, i), place.timeZone, 'yyyy-MM-dd');
    return { ymd, slots: storeSlotsOn(place, ymd, now) };
  });
}
