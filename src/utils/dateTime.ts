import { addDays, format as formatLocal, isBefore, parse, startOfWeek } from 'date-fns';
import { format as formatZoned, fromZonedTime } from 'date-fns-tz';

import type { DayHours, Weekday, WeeklyHours } from '@/types';

export type StoreStatus = {
  isOpen: boolean;
  label: string;
};

export type EventPhase = 'upcoming' | 'live' | 'ended';

export const WEEKDAY_ORDER: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

/**
 * Weekday key ("mon".."sun") of a moment as seen in the given timezone.
 * Uses date-fns-tz so the result is correct regardless of the device timezone.
 */
function weekdayOf(date: Date, timeZone: string): Weekday {
  return formatZoned(date, 'EEE', { timeZone }).toLowerCase() as Weekday;
}

function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + (minutes ?? 0);
}

/** True when `date` falls on the same calendar day as `now` in `timeZone`. */
export function isToday(date: Date, timeZone: string, now: Date = new Date()): boolean {
  return (
    formatZoned(date, 'yyyy-MM-dd', { timeZone }) ===
    formatZoned(now, 'yyyy-MM-dd', { timeZone })
  );
}

/**
 * True when `date` falls within the current Monday–Sunday week as seen in
 * `timeZone`. Week boundaries are computed from the timezone's wall clock,
 * not the device timezone.
 */
export function isThisWeek(date: Date, timeZone: string, now: Date = new Date()): boolean {
  const todayWall = formatZoned(now, 'yyyy-MM-dd', { timeZone });
  // parse() gives us local Date fields that we treat as a pure calendar date.
  const weekStartWall = startOfWeek(parse(todayWall, 'yyyy-MM-dd', new Date()), {
    weekStartsOn: 1,
  });
  const nextWeekWall = addDays(weekStartWall, 7);

  const weekStart = fromZonedTime(
    `${formatLocal(weekStartWall, 'yyyy-MM-dd')}T00:00:00`,
    timeZone,
  );
  const weekEnd = fromZonedTime(
    `${formatLocal(nextWeekWall, 'yyyy-MM-dd')}T00:00:00`,
    timeZone,
  );

  return !isBefore(date, weekStart) && isBefore(date, weekEnd);
}

/** Whether an event is running right now (or has not started / already ended). */
export function getEventPhase(
  startsAtIso: string,
  endsAtIso: string,
  now: Date = new Date(),
): EventPhase {
  const start = new Date(startsAtIso);
  const end = new Date(endsAtIso);
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'ended';
}

/**
 * Open/closed state of the store right now, plus a human-readable label
 * ("Open until 18:00" / "Opens today at 10:00" / "Opens Mon 28 Sep 10:00").
 */
export function getStoreStatus(
  hours: WeeklyHours,
  timeZone: string,
  now: Date = new Date(),
): StoreStatus {
  const nowMinutes = toMinutes(formatZoned(now, 'HH:mm', { timeZone }));
  const today = hours[weekdayOf(now, timeZone)];

  if (today && nowMinutes >= toMinutes(today.open) && nowMinutes < toMinutes(today.close)) {
    return { isOpen: true, label: `Open until ${today.close}` };
  }
  if (today && nowMinutes < toMinutes(today.open)) {
    return { isOpen: false, label: `Opens today at ${today.open}` };
  }

  for (let daysAhead = 1; daysAhead <= 7; daysAhead += 1) {
    const day = addDays(now, daysAhead);
    const dayHours = hours[weekdayOf(day, timeZone)];
    if (dayHours) {
      const dayLabel =
        daysAhead === 1 ? 'tomorrow' : formatZoned(day, 'EEE d MMM', { timeZone });
      return { isOpen: false, label: `Opens ${dayLabel} ${dayHours.open}` };
    }
  }

  return { isOpen: false, label: 'Closed' };
}

/** Weekday key of "today" in the given timezone (used to highlight hours rows). */
export function getCurrentWeekday(timeZone: string, now: Date = new Date()): Weekday {
  return weekdayOf(now, timeZone);
}

/** "17:00 – 23:00" for one day's hours, or "Closed". */
export function formatHoursRange(day: DayHours | null): string {
  return day ? `${day.open} – ${day.close}` : 'Closed';
}

/**
 * "Fri 25 Sep, 17:00 – 23:00" rendered in the event's own timezone; when the
 * event spans multiple days the end date is included too.
 */
export function formatEventWindow(
  startsAtIso: string,
  endsAtIso: string,
  timeZone: string,
): string {
  const start = new Date(startsAtIso);
  const end = new Date(endsAtIso);
  const sameDay =
    formatZoned(start, 'yyyy-MM-dd', { timeZone }) ===
    formatZoned(end, 'yyyy-MM-dd', { timeZone });

  const startPart = formatZoned(start, 'EEE d MMM, HH:mm', { timeZone });
  const endPart = formatZoned(
    end,
    sameDay ? 'HH:mm' : 'EEE d MMM, HH:mm',
    { timeZone },
  );
  return `${startPart} – ${endPart}`;
}

/** Uppercase date badge parts, e.g. { weekday: 'FRI', day: '25', month: 'SEP' }. */
export function formatDayBadge(
  iso: string,
  timeZone: string,
): { weekday: string; day: string; month: string } {
  const date = new Date(iso);
  return {
    weekday: formatZoned(date, 'EEE', { timeZone }).toUpperCase(),
    day: formatZoned(date, 'dd', { timeZone }),
    month: formatZoned(date, 'MMM', { timeZone }).toUpperCase(),
  };
}
