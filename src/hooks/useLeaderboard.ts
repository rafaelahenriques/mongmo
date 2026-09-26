import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getLeaderboard } from '@/api/endpoints';
import { useProfile } from '@/hooks/useProfile';
import { useActivityStore } from '@/state/activityStore';
import { useSettingsStore } from '@/state/settingsStore';
import { totalPoints } from '@/utils/achievements';
import type { LeaderboardEntry, LeaderboardPeriod } from '@/types';

/** A leaderboard row with its rank and whether it is the signed-in user. */
export type LeaderboardRow = LeaderboardEntry & {
  rank: number;
  isMe: boolean;
};

const MY_USER_ID = 'me';

/**
 * Peers from `GET /leaderboard?period=` merged with the local user's own
 * score, then ranked. When the privacy toggle is off the local row is
 * omitted entirely (it never leaves the device either way).
 */
export function useLeaderboard(period: LeaderboardPeriod) {
  const query = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: ({ signal }) => getLeaderboard(period, signal),
  });

  const profile = useProfile();
  const points = useActivityStore((state) =>
    totalPoints({
      checkIns: state.checkIns,
      shares: state.shares,
      redemptions: state.redemptions,
    }),
  );
  const visible = useSettingsStore((state) => state.leaderboardVisible);

  const rows = useMemo<LeaderboardRow[]>(() => {
    const mine: LeaderboardEntry[] = visible
      ? [{ userId: MY_USER_ID, name: profile.data?.name ?? 'You', points }]
      : [];
    return [...(query.data ?? []), ...mine]
      .sort((a, b) => b.points - a.points)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isMe: entry.userId === MY_USER_ID,
      }));
  }, [query.data, points, visible, profile.data?.name]);

  return { query, rows, hidden: !visible };
}
