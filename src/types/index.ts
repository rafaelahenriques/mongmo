/** Shared domain types for the Mongmo discovery app. */

/** Bare geographic coordinate. */
export type Coordinates = {
  latitude: number;
  longitude: number;
};

/** Live "how busy" state. Websocket updates overlay occupancy onto this. */
export type BusyState = {
  occupancy: number;
  capacity: number;
};

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Opening hours for a single day as 24h "HH:mm"; null means closed that day. */
export type DayHours = {
  open: string;
  close: string;
};

export type WeeklyHours = Record<Weekday, DayHours | null>;

/** One row on the event detail screen's menu preview. */
export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price?: string;
};

/**
 * The single permanent Mongmo location. Kept distinct from {@link PopUpEvent}
 * via the `type` discriminator so stores and events are never merged into one
 * generic location list.
 */
export type Store = {
  type: 'store';
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  /** IANA timezone all of this entity's times must be interpreted in. */
  timeZone: string;
  hours: WeeklyHours;
  amenities: string[];
  busy: BusyState;
  phone: string;
  orderUrl: string;
};

/**
 * A temporary pop-up event. The server can add or remove these without any
 * app changes; each one is only relevant while it is running.
 */
export type PopUpEvent = {
  type: 'event';
  id: string;
  title: string;
  city: string;
  venue: string;
  coordinates: Coordinates;
  /** ISO 8601 with UTC offset, e.g. "2026-09-25T17:00:00+02:00". */
  startsAt: string;
  endsAt: string;
  /** IANA timezone used for date filtering and display. */
  timeZone: string;
  description: string;
  imageUrl: string;
  tags: string[];
  menu: MenuItem[];
  orderUrl: string;
  busy: BusyState;
};

/** Anything that can be pinned: either the store or an event, never blended. */
export type MapEntity = Store | PopUpEvent;

/** Date filters offered by the map's filter bar (the store ignores these). */
export type EventFilter = 'today' | 'week' | 'all';

/** Payload pushed over the busy-count websocket. */
export type BusyUpdate = {
  id: string;
  occupancy: number;
};

/* ------------------------------------------------------------------ *
 * Profiles, achievements and leaderboards (GET /profile,              *
 * GET /achievements, GET /leaderboard?period=).                       *
 * ------------------------------------------------------------------ */

/** The signed-in user's profile as served by `GET /profile`. */
export type UserProfile = {
  id: string;
  name: string;
  bio: string;
  avatarUrl: string;
  homeCity: string;
  /** ISO date the account was created ("2026-01-12"). */
  memberSince: string;
};

/**
 * Server-owned badge definition. The client's evaluator decides *when* a
 * badge is earned; `description` doubles as the hint shown while locked,
 * so the server can retune copy without an app release.
 */
export type BadgeDefinition = {
  id: string;
  title: string;
  description: string;
  emoji: string;
};

/** A badge the user has earned, with its unlock time. */
export type EarnedBadge = {
  badgeId: string;
  earnedAt: string;
};

/** `GET /achievements` response: the badge catalog plus redeemable rewards. */
export type AchievementsResponse = {
  badges: BadgeDefinition[];
  rewards: Reward[];
};

/** One event check-in, recorded locally; also powers the photo gallery. */
export type CheckInRecord = {
  eventId: string;
  title: string;
  city: string;
  imageUrl: string;
  /** Start time of the event as served (for night-owl evaluation). */
  startsAt: string;
  /** When the user actually checked in (ISO 8601). */
  checkedInAt: string;
};

/** Spendable reward from the achievements catalog. */
export type Reward = {
  id: string;
  title: string;
  description: string;
  costPoints: number;
};

/** Leaderboard time windows offered by `GET /leaderboard?period=`. */
export type LeaderboardPeriod = 'weekly' | 'all';

/** One row returned by the leaderboard endpoint (ranking happens client-side). */
export type LeaderboardEntry = {
  userId: string;
  name: string;
  points: number;
};
