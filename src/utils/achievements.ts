import { format as formatZoned } from 'date-fns-tz';

import type { CheckInRecord, EarnedBadge } from '@/types';

/**
 * Pure, dependency-free achievement logic: points, streaks and badge
 * evaluation. All inputs are plain data (usually straight out of the
 * activity store) so every rule is unit-testable and deterministic.
 *
 * Calendar arithmetic runs on UTC-midnight timestamps of "yyyy-MM-dd" day
 * keys, so streaks behave like real calendar days regardless of the device
 * timezone or DST — day keys themselves are formatted in Europe/Brussels,
 * the app's reference timezone for activity.
 */

/** Points granted for one event check-in / one share. */
export const POINTS_PER_CHECK_IN = 50;
export const POINTS_PER_SHARE = 10;

/** Reference timezone for "which day was that" questions (streaks, night owl). */
export const ACTIVITY_TIME_ZONE = 'Europe/Brussels';

/** Badge ids; kept in sync with the server catalog served by GET /achievements. */
export const BADGE_IDS = {
  firstCheckIn: 'first-check-in',
  streakFive: 'streak-5',
  tenEvents: 'ten-events',
  twoCities: 'two-cities',
  nightOwl: 'night-owl',
  sharer: 'word-of-mouth',
} as const;

export type ActivityShare = {
  eventId: string;
  sharedAt: string;
};

export type ActivityRedemption = {
  costPoints: number;
};

export type ActivityInput = {
  checkIns: readonly CheckInRecord[];
  shares: readonly ActivityShare[];
  redemptions: readonly ActivityRedemption[];
};

export type AchievementStats = {
  points: number;
  eventsAttended: number;
  citiesVisited: number;
  currentStreakDays: number;
  longestStreakDays: number;
};

/** Everything the achievements screen header needs, derived from activity. */
export type AchievementsSummary = AchievementStats & {
  earned: EarnedBadge[];
};

/* ----------------------------- day keys ----------------------------- */

/** "yyyy-MM-dd" of an instant as seen in {@link ACTIVITY_TIME_ZONE}. */
function dayKey(instantIso: string, now: Date): string {
  return formatZoned(new Date(instantIso), 'yyyy-MM-dd', { timeZone: ACTIVITY_TIME_ZONE });
}

/** UTC-midnight timestamp of a "yyyy-MM-dd" key — pure calendar math. */
function dayNumber(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

/* ------------------------------ points ------------------------------ */

export function totalPoints(input: ActivityInput): number {
  const earned =
    input.checkIns.length * POINTS_PER_CHECK_IN + input.shares.length * POINTS_PER_SHARE;
  const spent = input.redemptions.reduce((sum, redemption) => sum + redemption.costPoints, 0);
  return Math.max(0, earned - spent);
}

/* ------------------------------ streaks ----------------------------- */

/**
 * Current streak of consecutive days (ending today, or yesterday when
 * today's visit hasn't happened yet) plus the all-time longest run.
 */
export function streaks(checkIns: readonly CheckInRecord[], now: Date = new Date()): {
  current: number;
  longest: number;
} {
  const days = [...new Set(checkIns.map((checkIn) => dayKey(checkIn.checkedInAt, now)))].sort(
    (a, b) => dayNumber(a) - dayNumber(b),
  );
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let index = 1; index < days.length; index += 1) {
    const previous = dayNumber(days[index - 1] as string);
    const current = dayNumber(days[index] as string);
    run = current - previous === 86_400_000 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const latest = dayNumber(days[days.length - 1] as string);
  const today = dayNumber(dayKey(now.toISOString(), now));
  const yesterday = today - 86_400_000;
  if (latest !== today && latest !== yesterday) return { current: 0, longest };

  let current = 1;
  for (let index = days.length - 1; index > 0; index -= 1) {
    const next = dayNumber(days[index] as string);
    const previous = dayNumber(days[index - 1] as string);
    if (next - previous !== 86_400_000) break;
    current += 1;
  }
  return { current, longest };
}

/* ------------------------------ badges ------------------------------ */

function firstCheckInAt(checkIns: readonly CheckInRecord[]): string | null {
  return checkIns.length > 0 ? (checkIns[0] as CheckInRecord).checkedInAt : null;
}

function nightOwlCheckInAt(checkIns: readonly CheckInRecord[]): string | null {
  const late = checkIns.find((checkIn) => {
    const hour = Number(formatZoned(new Date(checkIn.checkedInAt), 'HH', {
      timeZone: ACTIVITY_TIME_ZONE,
    }));
    return hour >= 21 || hour < 5;
  });
  return late ? late.checkedInAt : null;
}

function secondCityCheckInAt(checkIns: readonly CheckInRecord[]): string | null {
  const cities = new Set<string>();
  for (const checkIn of checkIns) {
    if (cities.size >= 1 && !cities.has(checkIn.city)) return checkIn.checkedInAt;
    cities.add(checkIn.city);
  }
  return null;
}

/** The check-in at which the first ≥5-day consecutive run completed. */
function streakFiveCheckInAt(checkIns: readonly CheckInRecord[], now: Date): string | null {
  const byDay = new Map<string, string>();
  for (const checkIn of checkIns) {
    const day = dayKey(checkIn.checkedInAt, now);
    const existing = byDay.get(day);
    if (!existing || checkIn.checkedInAt < existing) byDay.set(day, checkIn.checkedInAt);
  }
  const days = [...byDay.keys()].sort((a, b) => dayNumber(a) - dayNumber(b));
  let run = 0;
  let previous: number | null = null;
  for (const day of days) {
    const value = dayNumber(day);
    run = previous !== null && value - previous === 86_400_000 ? run + 1 : 1;
    previous = value;
    if (run >= 5) return byDay.get(day) ?? null;
  }
  return null;
}

/** Badge ids the current activity has unlocked, with unlock timestamps. */
export function evaluateBadges(input: ActivityInput, now: Date = new Date()): EarnedBadge[] {
  const { checkIns, shares } = input;
  const tenthCheckIn = checkIns.length >= 10 ? checkIns[9] : undefined;

  const unlocks: (EarnedBadge | null)[] = [
    firstCheckInAt(checkIns)
      ? { badgeId: BADGE_IDS.firstCheckIn, earnedAt: firstCheckInAt(checkIns) as string }
      : null,
    streakFiveCheckInAt(checkIns, now)
      ? {
          badgeId: BADGE_IDS.streakFive,
          earnedAt: streakFiveCheckInAt(checkIns, now) as string,
        }
      : null,
    tenthCheckIn ? { badgeId: BADGE_IDS.tenEvents, earnedAt: tenthCheckIn.checkedInAt } : null,
    secondCityCheckInAt(checkIns)
      ? { badgeId: BADGE_IDS.twoCities, earnedAt: secondCityCheckInAt(checkIns) as string }
      : null,
    nightOwlCheckInAt(checkIns)
      ? { badgeId: BADGE_IDS.nightOwl, earnedAt: nightOwlCheckInAt(checkIns) as string }
      : null,
    shares.length > 0
      ? {
          badgeId: BADGE_IDS.sharer,
          earnedAt: (shares[0] as ActivityShare).sharedAt,
        }
      : null,
  ];

  return unlocks.filter((badge): badge is EarnedBadge => badge !== null);
}

/** One call the achievements screen makes to summarize local activity. */
export function summarizeActivity(
  input: ActivityInput,
  now: Date = new Date(),
): AchievementsSummary {
  const { current, longest } = streaks(input.checkIns, now);
  const cities = new Set(input.checkIns.map((checkIn) => checkIn.city));
  return {
    points: totalPoints(input),
    eventsAttended: input.checkIns.length,
    citiesVisited: cities.size,
    currentStreakDays: current,
    longestStreakDays: longest,
    earned: evaluateBadges(input, now),
  };
}
