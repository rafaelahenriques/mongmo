import {
  badgeRowToBadgeDefinition,
  eventRowToEvent,
  profileRowToUserProfile,
  rewardRowToReward,
  statsRowToProfileStats,
  storeRowToStore,
} from '@/api/mappers';
import { toApiError } from '@/api/errors';
import { getCurrentUserId, supabase } from '@/lib/supabase';
import { isThisWeek, isToday } from '@/utils/dateTime';
import type { Database } from '@/types/database';
import type {
  AchievementsResponse,
  CheckInRecord,
  EarnedBadge,
  EventFilter,
  LeaderboardEntry,
  LeaderboardPeriod,
  PopUpEvent,
  ProfileStats,
  Store,
  UserProfile,
} from '@/types';

/** GET the single permanent Mongmo store. */
export async function getStore(): Promise<Store> {
  const { data, error } = await supabase.from('stores').select('*').limit(1).single();
  if (error) throw toApiError(error);
  return storeRowToStore(data);
}

/** Only events that have not ended yet, and are not cancelled, are relevant. */
function isRelevant(event: PopUpEvent, now: Date): boolean {
  return new Date(event.endsAt).getTime() >= now.getTime();
}

/**
 * Timezone-correct filtering: each event's start time is compared against
 * "now" as seen in the event's own timezone, never the device timezone.
 */
function matchesFilter(event: PopUpEvent, filter: EventFilter, now: Date): boolean {
  if (filter === 'all') return true;
  const start = new Date(event.startsAt);
  return filter === 'today' ? isToday(start, event.timeZone, now) : isThisWeek(start, event.timeZone, now);
}

/**
 * Columns customers may read on `events` — everything except `qr_token`,
 * which is revoked from `authenticated` (see 0006_qr_token_hardening.sql) so
 * scanning the printed QR code is the only way to learn it.
 */
const EVENT_COLUMNS =
  'id, title, type, city, venue, latitude, longitude, starts_at, ends_at, time_zone, ' +
  'description, image_url, tags, capacity, occupancy, status, order_url, created_by, created_at';

type EventRow = Database['public']['Tables']['events']['Row'];

/** Pop-up events for a date filter, nearest first. */
export async function getEvents(filter: EventFilter): Promise<PopUpEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .neq('status', 'cancelled')
    .order('starts_at', { ascending: true })
    // The select-string parser gives up (falls back to an error type) once
    // an explicit column list is chained with a filter/order call, so the
    // shape is asserted explicitly instead — same columns, just not parsed.
    .returns<EventRow[]>();
  if (error) throw toApiError(error);

  const now = new Date();
  return data
    .map((row) => eventRowToEvent(row))
    .filter((event) => isRelevant(event, now))
    .filter((event) => matchesFilter(event, filter, now));
}

type EventMenuRow = {
  menus: { menu_items: Database['public']['Tables']['menu_items']['Row'][] } | null;
};

/** A single event plus its menu, for the detail screen (or a push deep link). */
export async function getEvent(id: string): Promise<PopUpEvent> {
  const [eventResult, menuResult] = await Promise.all([
    supabase.from('events').select(EVENT_COLUMNS).eq('id', id).single().returns<EventRow>(),
    supabase.from('event_menus').select('menus(menu_items(*))').eq('event_id', id).returns<EventMenuRow[]>(),
  ]);

  if (eventResult.error) throw toApiError(eventResult.error);
  if (menuResult.error) throw toApiError(menuResult.error);

  const menuItemRows = menuResult.data
    .flatMap((row) => row.menus?.menu_items ?? [])
    .filter((item) => item.available)
    .sort((a, b) => a.sort_order - b.sort_order);

  return eventRowToEvent(eventResult.data, menuItemRows);
}

/** The signed-in user's profile. */
export async function getProfile(): Promise<UserProfile> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw toApiError(error);
  return profileRowToUserProfile(data);
}

/** Updates the leaderboard-visibility privacy toggle (Settings → Privacy). */
export async function setLeaderboardVisible(visible: boolean): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('profiles')
    .update({ leaderboard_visible: visible })
    .eq('id', userId);
  if (error) throw toApiError(error);
}

/** Badge catalog (earned + locked) and the redeemable rewards catalog. */
export async function getAchievements(): Promise<AchievementsResponse> {
  const [badgesResult, rewardsResult] = await Promise.all([
    supabase.from('badges').select('*').order('sort_order'),
    supabase.from('rewards').select('*').eq('active', true).order('cost_points'),
  ]);
  if (badgesResult.error) throw toApiError(badgesResult.error);
  if (rewardsResult.error) throw toApiError(rewardsResult.error);

  return {
    badges: badgesResult.data.map(badgeRowToBadgeDefinition),
    rewards: rewardsResult.data.map(rewardRowToReward),
  };
}

/** Badges the signed-in user has already earned, with unlock timestamps. */
export async function getEarnedBadges(): Promise<EarnedBadge[]> {
  const { data, error } = await supabase.from('user_badges').select('badge_id, earned_at');
  if (error) throw toApiError(error);
  return data.map((row) => ({ badgeId: row.badge_id, earnedAt: row.earned_at }));
}

/** Reward instances the signed-in user has redeemed (used or not). */
export async function getUserRewards() {
  const { data, error } = await supabase.from('user_rewards').select('*');
  if (error) throw toApiError(error);
  return data;
}

type ExpiringUserRewardRow = {
  id: string;
  rewards: { title: string; expires_at: string | null } | null;
};

/** Unused, unexpired redeemed rewards, for the expiry-reminder notification. */
export async function getExpiringUserRewards(): Promise<
  { userRewardId: string; title: string; expiresAt: string }[]
> {
  const { data, error } = await supabase
    .from('user_rewards')
    .select('id, rewards(title, expires_at)')
    .is('used_at', null)
    .returns<ExpiringUserRewardRow[]>();
  if (error) throw toApiError(error);

  return data
    .filter((row): row is ExpiringUserRewardRow & { rewards: { title: string; expires_at: string } } =>
      row.rewards !== null && row.rewards.expires_at !== null,
    )
    .map((row) => ({
      userRewardId: row.id,
      title: row.rewards.title,
      expiresAt: row.rewards.expires_at,
    }));
}

/** Current points balance, computed server-side from the points ledger. */
export async function getPointsBalance(): Promise<number> {
  const { data, error } = await supabase.rpc('my_points_balance');
  if (error) throw toApiError(error);
  return data;
}

/** Cumulative stats for the Profile screen (events attended, orders, etc.). */
export async function getProfileStats(): Promise<ProfileStats> {
  const { data, error } = await supabase.rpc('my_stats');
  if (error) throw toApiError(error);
  return statsRowToProfileStats(data[0]);
}

/** Spends points on a reward; the server validates balance + expiry. */
export async function redeemReward(rewardId: string): Promise<void> {
  const { error } = await supabase.rpc('redeem_reward', { p_reward_id: rewardId });
  if (error) throw toApiError(error);
}

/** Verifies + records a check-in: QR token match, event window, geofence. */
export async function verifyCheckIn(
  eventId: string,
  qrToken: string,
  coordinates: { latitude: number; longitude: number },
): Promise<void> {
  const { error } = await supabase.rpc('verify_check_in', {
    p_event_id: eventId,
    p_qr_token: qrToken,
    p_latitude: coordinates.latitude,
    p_longitude: coordinates.longitude,
  });
  if (error) throw toApiError(error);
}

type VisitedEventRow = {
  checked_in_at: string;
  events: {
    id: string;
    title: string;
    city: string;
    image_url: string | null;
    starts_at: string;
  } | null;
};

/** Past check-ins joined with their event, newest first — powers the photo gallery. */
export async function getVisitedEvents(): Promise<CheckInRecord[]> {
  // Scoped explicitly: RLS also lets an owner read every customer's check-ins.
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('check_ins')
    .select('checked_in_at, events(id, title, city, image_url, starts_at)')
    .eq('user_id', userId)
    .order('checked_in_at', { ascending: false })
    .returns<VisitedEventRow[]>();
  if (error) throw toApiError(error);

  return data
    .filter((row): row is VisitedEventRow & { events: NonNullable<VisitedEventRow['events']> } =>
      row.events !== null,
    )
    .map((row) => ({
      eventId: row.events.id,
      title: row.events.title,
      city: row.events.city,
      imageUrl: row.events.image_url ?? '',
      startsAt: row.events.starts_at,
      checkedInAt: row.checked_in_at,
    }));
}

/** Other members' leaderboard scores for a period, aggregated server-side. */
export async function getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('leaderboard', { p_period: period });
  if (error) throw toApiError(error);
  return data.map((row) => ({ userId: row.user_id, name: row.name, points: row.points }));
}
