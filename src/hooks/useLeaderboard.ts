import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getLeaderboard } from '@/api/endpoints';
import { useProfile } from '@/hooks/useProfile';
import type { LeaderboardEntry, LeaderboardPeriod } from '@/types';

/** A leaderboard row with its rank and whether it is the signed-in user. */
export type LeaderboardRow = LeaderboardEntry & {
  rank: number;
  isMe: boolean;
};

/**
 * Server-aggregated leaderboard for a period. Rows are already ordered by
 * points; a hidden user (their own privacy toggle) is simply absent.
 */
export function useLeaderboard(period: LeaderboardPeriod) {
  const query = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => getLeaderboard(period),
  });

  const profile = useProfile();
  const myId = profile.data?.id;

  const rows = useMemo<LeaderboardRow[]>(
    () =>
      (query.data ?? []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isMe: entry.userId === myId,
      })),
    [query.data, myId],
  );

  return { query, rows, hidden: profile.data ? !profile.data.leaderboardVisible : false };
}
