import { apiGet } from '@/api/client';
import type {
  AchievementsResponse,
  EventFilter,
  LeaderboardEntry,
  LeaderboardPeriod,
  PopUpEvent,
  Store,
  UserProfile,
} from '@/types';

/** GET /store — the single permanent Mongmo location. */
export function getStore(signal?: AbortSignal): Promise<Store> {
  return apiGet<Store>('/store', undefined, signal);
}

/** GET /events?filter=… — temporary pop-ups, filterable by date. */
export function getEvents(filter: EventFilter, signal?: AbortSignal): Promise<PopUpEvent[]> {
  return apiGet<PopUpEvent[]>('/events', { filter }, signal);
}

/** GET /events/:id — a single event (detail screen / push deep link). */
export function getEvent(id: string, signal?: AbortSignal): Promise<PopUpEvent> {
  return apiGet<PopUpEvent>(`/events/${encodeURIComponent(id)}`, undefined, signal);
}

/** GET /profile — the signed-in user's profile. */
export function getProfile(signal?: AbortSignal): Promise<UserProfile> {
  return apiGet<UserProfile>('/profile', undefined, signal);
}

/** GET /achievements — badge catalog and redeemable rewards. */
export function getAchievements(signal?: AbortSignal): Promise<AchievementsResponse> {
  return apiGet<AchievementsResponse>('/achievements', undefined, signal);
}

/** GET /leaderboard?period=weekly|all — other members' scores. */
export function getLeaderboard(
  period: LeaderboardPeriod,
  signal?: AbortSignal,
): Promise<LeaderboardEntry[]> {
  return apiGet<LeaderboardEntry[]>('/leaderboard', { period }, signal);
}
