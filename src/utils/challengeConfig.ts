import { formatInTimeZone } from 'date-fns-tz';

import type { ChallengeRules, ChallengeType } from '@/types';

/**
 * The limits the server enforces on challenge settings
 * (supabase/migrations/0012_challenge_settings.sql), mirrored so the owner's
 * form can stop a bad value before it's sent. Change both together.
 */
export const CHALLENGE_LIMITS = {
  titleLength: 80,
  descriptionLength: 280,
  radiusM: { min: 100, max: 2000, step: 100, fallback: 500 },
  capturePhotos: { min: 1, max: 5, fallback: 1 },
  discoveryPhotos: { min: 1, max: 3, fallback: 1 },
  dishCount: { min: 2, max: 10, fallback: 3 },
  popupCount: { min: 2, max: 20, fallback: 3 },
  danceSeconds: { min: 10, max: 60, step: 5, fallback: 20 },
  voteOptions: { min: 2, max: 6, length: 40 },
  promptLength: 120,
  hintLength: 160,
  dishLength: 60,
  messageLength: 200,
} as const;

type Range = { min: number; max: number; fallback: number };
type EventWindow = { startsAt: string; endsAt: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const integerIn = (value: unknown, range: Range): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= range.min && value <= range.max
    ? value
    : range.fallback;

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const isoOr = (value: unknown, fallback: string): string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : fallback;

/** The pop-up's first hour (or all of it, if shorter): the default timing window. */
function firstHour(event: EventWindow): { startsAt: string; endsAt: string } {
  const start = Date.parse(event.startsAt);
  const end = Math.min(start + 60 * 60_000, Date.parse(event.endsAt));
  return { startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString() };
}

/**
 * Reads a challenge's settings from the server's JSON, falling back to the
 * defaults for anything missing — so an older or partial row still renders.
 * (The server always stores a timing window; `event` only seeds a new one.)
 */
export function parseChallengeRules(
  type: ChallengeType,
  raw: unknown,
  event: EventWindow = { startsAt: new Date().toISOString(), endsAt: new Date().toISOString() },
): ChallengeRules {
  const config = isRecord(raw) ? raw : {};
  switch (type) {
    case 'explore':
      return { type, config: { radiusM: integerIn(config.radiusM, CHALLENGE_LIMITS.radiusM) } };
    case 'check_in':
      return { type, config: {} };
    case 'capture':
      return {
        type,
        config: {
          photoCount: integerIn(config.photoCount, CHALLENGE_LIMITS.capturePhotos),
          prompt: text(config.prompt),
        },
      };
    case 'discovery':
      return {
        type,
        config: {
          photoCount: integerIn(config.photoCount, CHALLENGE_LIMITS.discoveryPhotos),
          hint: text(config.hint),
        },
      };
    case 'taste':
      return { type, config: { dish: text(config.dish) } };
    case 'social':
      return { type, config: { message: text(config.message) } };
    case 'timing': {
      const fallback = firstHour(event);
      return {
        type,
        config: { startsAt: isoOr(config.startsAt, fallback.startsAt), endsAt: isoOr(config.endsAt, fallback.endsAt) },
      };
    }
    case 'collection':
      return { type, config: { dishCount: integerIn(config.dishCount, CHALLENGE_LIMITS.dishCount) } };
    case 'streak':
      return { type, config: { popupCount: integerIn(config.popupCount, CHALLENGE_LIMITS.popupCount) } };
    case 'community':
      return {
        type,
        config: {
          options: Array.isArray(config.options) ? config.options.map(text).filter(Boolean) : [],
        },
      };
    case 'motion':
      return { type, config: { seconds: integerIn(config.seconds, CHALLENGE_LIMITS.danceSeconds) } };
  }
}

/** Fresh settings for a newly picked type. A new vote starts with two blank options. */
export function defaultChallengeRules(type: ChallengeType, event: EventWindow): ChallengeRules {
  const rules = parseChallengeRules(type, {}, event);
  return rules.type === 'community' ? { type: rules.type, config: { options: ['', ''] } } : rules;
}

/**
 * Why the owner can't save these settings yet, or null. The server checks
 * the same things; this just says so before the round trip.
 */
export function challengeRulesProblem(rules: ChallengeRules): string | null {
  switch (rules.type) {
    case 'timing':
      return Date.parse(rules.config.endsAt) > Date.parse(rules.config.startsAt)
        ? null
        : 'The time window has to end after it starts.';
    case 'community': {
      const options = rules.config.options.map((option) => option.trim()).filter(Boolean);
      const distinct = new Set(options.map((option) => option.toLowerCase()));
      if (distinct.size < CHALLENGE_LIMITS.voteOptions.min) return 'Add at least two different options.';
      if (distinct.size !== options.length) return 'Each option should be different.';
      return null;
    }
    default:
      return null;
  }
}

/** What the server should store: trimmed text, blank vote options dropped. */
export function challengeConfigPayload(rules: ChallengeRules): Record<string, unknown> {
  if (rules.type === 'community') {
    return { options: rules.config.options.map((option) => option.trim()).filter(Boolean) };
  }
  return Object.fromEntries(
    Object.entries(rules.config).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  );
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * The one line that tells a customer what counts, e.g. "Take 3 photos" or
 * "Between 18:00 and 19:00". Null when the title and description say it all.
 */
export function challengeRequirement(rules: ChallengeRules, timeZone: string): string | null {
  switch (rules.type) {
    case 'explore':
      return `Be within ${rules.config.radiusM} m of the venue`;
    case 'capture':
      return `Take ${plural(rules.config.photoCount, 'photo', 'photos')}${rules.config.prompt ? ` of ${rules.config.prompt}` : ''}`;
    case 'discovery':
      return rules.config.hint ? `Hint: ${rules.config.hint}` : `Take ${plural(rules.config.photoCount, 'photo', 'photos')}`;
    case 'taste':
      return rules.config.dish ? `Rate the ${rules.config.dish}` : null;
    case 'timing':
      return `Between ${formatInTimeZone(rules.config.startsAt, timeZone, 'HH:mm')} and ${formatInTimeZone(rules.config.endsAt, timeZone, 'HH:mm')}`;
    case 'collection':
      return `Order ${rules.config.dishCount} different dishes here`;
    case 'streak':
      return `Check in at ${rules.config.popupCount} Mongmo pop-ups`;
    case 'community':
      return `Vote: ${rules.config.options.join(' · ')}`;
    case 'motion':
      return `Dance for ${rules.config.seconds} seconds with your phone`;
    case 'check_in':
    case 'social':
      return null;
  }
}
