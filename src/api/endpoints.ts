import {
  badgeRowToBadgeDefinition,
  eventRowToEvent,
  profileRowToUserProfile,
  rewardRowToReward,
  statsRowToProfileStats,
  storeRowToStore,
} from '@/api/mappers';
import { ApiError, toApiError } from '@/api/errors';
import { getCurrentUserId, supabase } from '@/lib/supabase';
import { isThisWeek, isToday } from '@/utils/dateTime';
import type { Database } from '@/types/database';
import type {
  AchievementsResponse,
  EarnedBadge,
  EventFilter,
  LeaderboardEntry,
  LeaderboardPeriod,
  Level,
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
  const read = () => supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  let { data, error } = await read();
  if (error) throw toApiError(error);
  if (!data) {
    // Signed in but no profile (an older account): make it, then read it.
    await ensureProfile();
    ({ data, error } = await read());
    if (error) throw toApiError(error);
    if (!data) throw new Error('Couldn’t set up your profile.');
  }
  return profileRowToUserProfile(data);
}

/**
 * Makes the signed-in user's profile if it's missing (0019_ensure_profile.sql).
 * Orders, check-ins and points all hang off it.
 */
export async function ensureProfile(): Promise<void> {
  const { error } = await supabase.rpc('ensure_profile');
  if (error) throw toApiError(error);
}

export type ProfileEdit = {
  name: string;
  bio: string;
  homeCity: string;
};

/**
 * Saves the signed-in user's editable details. Only these columns are
 * writable for them at all (0011_profile_editing.sql); an empty home city is
 * stored as none.
 */
export async function updateProfile(edit: ProfileEdit): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('profiles')
    .update({ name: edit.name.trim(), bio: edit.bio.trim(), home_city: edit.homeCity.trim() || null })
    .eq('id', userId);
  if (error) {
    // 23514 = a check constraint: something empty or too long slipped past the form.
    throw error.code === '23514'
      ? new ApiError('Check your details: your name is required and each field has a length limit.', 400)
      : toApiError(error);
  }
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

export type BadgeProgress = { current: number; target: number };

/**
 * How far the signed-in user is towards every badge, keyed by badge key
 * ("3 of 5"). The server's badge_progress() is the one definition of each
 * badge's rule, so this always agrees with what gets awarded.
 */
export async function getBadgeProgress(): Promise<Record<string, BadgeProgress>> {
  const { data, error } = await supabase.rpc('my_badge_progress');
  if (error) throw toApiError(error);
  return Object.fromEntries(data.map((row) => [row.key, { current: row.current, target: row.target }]));
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

/** The points an order actually earned once collected (null before that). */
export async function getOrderPoints(orderId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('point_events')
    .select('points')
    .eq('source', 'order')
    .eq('source_id', orderId)
    .maybeSingle();
  if (error) throw toApiError(error);
  return data?.points ?? null;
}

/** The loyalty levels, lowest first (Dough, Rising, Golden, Crisp). */
export async function getLevels(): Promise<Level[]> {
  const { data, error } = await supabase.from('levels').select('*').order('min_points');
  if (error) throw toApiError(error);
  return data.map((row) => ({
    key: row.key,
    name: row.name,
    minPoints: row.min_points,
    orderBonusPct: row.order_bonus_pct,
    perk: row.perk,
  }));
}

/**
 * Your lifetime points (everything ever earned: the level comes from it) and
 * whether your next collected order still earns the welcome double.
 */
export async function getLoyalty(): Promise<{ lifetimePoints: number; firstOrderBonus: boolean }> {
  const { data, error } = await supabase.rpc('my_loyalty');
  if (error) throw toApiError(error);
  const row = data[0];
  return { lifetimePoints: row?.lifetime_points ?? 0, firstOrderBonus: row?.first_order_bonus ?? true };
}

/** One line of the points ledger, with what it was for. */
export type PointsHistoryEntry = {
  id: string;
  points: number;
  source: 'challenge_completion' | 'badge' | 'reward_redeemed' | 'order';
  /** The challenge, badge or reward. */
  title: string;
  /** The pop-up a challenge belonged to. */
  place: string | null;
  challengeType: string | null;
  createdAt: string;
};

type CompletionTitleRow = {
  id: string;
  challenges: { title: string; type: string; events: { title: string } | null } | null;
};

/**
 * The points ledger, newest first, with each entry's challenge, badge or
 * reward resolved to a title (RLS limits every table to the user's own rows).
 */
export async function getPointsHistory(limit = 50): Promise<PointsHistoryEntry[]> {
  const { data: rows, error } = await supabase
    .from('point_events')
    .select('id, points, source, source_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw toApiError(error);
  const idsFor = (source: string) =>
    rows.filter((row) => row.source === source && row.source_id).map((row) => row.source_id as string);

  const [completions, badges, rewards, orders] = await Promise.all([
    supabase.from('challenge_completions').select('id, challenges(title, type, events(title))').in('id', idsFor('challenge_completion')),
    supabase.from('user_badges').select('id, badges(title)').in('id', idsFor('badge')),
    supabase.from('user_rewards').select('id, rewards(title)').in('id', idsFor('reward_redeemed')),
    supabase.from('orders').select('id, events(title), stores(name)').in('id', idsFor('order')),
  ]);
  for (const result of [completions, badges, rewards, orders]) if (result.error) throw toApiError(result.error);

  const completionById = new Map(
    ((completions.data ?? []) as unknown as CompletionTitleRow[]).map((row) => [row.id, row.challenges]),
  );
  const badgeById = new Map(
    ((badges.data ?? []) as unknown as { id: string; badges: { title: string } | null }[]).map((row) => [row.id, row.badges]),
  );
  const orderPlaceById = new Map(
    (
      (orders.data ?? []) as unknown as {
        id: string;
        events: { title: string } | null;
        stores: { name: string } | null;
      }[]
    ).map((row) => [row.id, row.events?.title ?? row.stores?.name ?? null]),
  );
  const rewardById = new Map(
    ((rewards.data ?? []) as unknown as { id: string; rewards: { title: string } | null }[]).map((row) => [row.id, row.rewards]),
  );

  return rows.map((row) => {
    const challenge = row.source === 'challenge_completion' ? completionById.get(row.source_id ?? '') : null;
    const title =
      row.source === 'challenge_completion'
        ? (challenge?.title ?? 'Challenge')
        : row.source === 'badge'
          ? `Badge: ${badgeById.get(row.source_id ?? '')?.title ?? 'unlocked'}`
          : row.source === 'order'
            ? 'Order picked up'
            : `Reward redeemed`;
    return {
      id: row.id,
      points: row.points,
      source: row.source,
      title,
      place:
        row.source === 'challenge_completion'
          ? (challenge?.events?.title ?? null)
          : row.source === 'reward_redeemed'
            ? (rewardById.get(row.source_id ?? '')?.title ?? null)
            : row.source === 'order'
              ? (orderPlaceById.get(row.source_id ?? '') ?? null)
              : null,
      challengeType: challenge?.type ?? null,
      createdAt: row.created_at,
    };
  });
}

/** Cumulative stats for the Profile screen (events attended, orders, etc.). */
export async function getProfileStats(): Promise<ProfileStats> {
  const { data, error } = await supabase.rpc('my_stats');
  if (error) throw toApiError(error);
  return statsRowToProfileStats(data[0]);
}

/** Spends points on a reward; the server validates balance + expiry. Resolves to the redeemed reward's id. */
export async function redeemReward(rewardId: string): Promise<string> {
  const { data, error } = await supabase.rpc('redeem_reward', { p_reward_id: rewardId });
  if (error) throw toApiError(error);
  return (data as { id: string }).id;
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

/** Other members' leaderboard scores for a period, aggregated server-side. */
export async function getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('leaderboard', { p_period: period });
  if (error) throw toApiError(error);
  return data.map((row) => ({ userId: row.user_id, name: row.name, points: row.points }));
}
