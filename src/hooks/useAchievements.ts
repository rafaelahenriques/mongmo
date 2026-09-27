import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getAchievements,
  getEarnedBadges,
  getPointsBalance,
  getProfileStats,
  getUserRewards,
  redeemReward,
} from '@/api/endpoints';
import type { EarnedBadge } from '@/types';

export type AchievementsSummary = {
  points: number;
  eventsAttended: number;
  citiesVisited: number;
  earned: EarnedBadge[];
};

/**
 * Everything the achievements screen needs: the server-owned catalog (badge
 * definitions, rewards) plus the signed-in user's own earned badges, points
 * and redeemed reward instances — all server-authoritative, nothing derived
 * on the client.
 */
export function useAchievements() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['achievements'],
    queryFn: () => getAchievements(),
  });

  const earnedQuery = useQuery({
    queryKey: ['badges', 'earned'],
    queryFn: () => getEarnedBadges(),
  });

  const pointsQuery = useQuery({
    queryKey: ['points'],
    queryFn: () => getPointsBalance(),
  });

  const statsQuery = useQuery({
    queryKey: ['profile-stats'],
    queryFn: () => getProfileStats(),
  });

  const userRewardsQuery = useQuery({
    queryKey: ['user-rewards'],
    queryFn: () => getUserRewards(),
  });

  const redeem = useMutation({
    mutationFn: (rewardId: string) => redeemReward(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points'] });
      queryClient.invalidateQueries({ queryKey: ['user-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['badges', 'earned'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  const summary = useMemo<AchievementsSummary>(
    () => ({
      points: pointsQuery.data ?? 0,
      eventsAttended: statsQuery.data?.eventsAttended ?? 0,
      citiesVisited: statsQuery.data?.citiesVisited ?? 0,
      earned: earnedQuery.data ?? [],
    }),
    [pointsQuery.data, statsQuery.data, earnedQuery.data],
  );

  return {
    query,
    summary,
    userRewards: userRewardsQuery.data ?? [],
    redeemReward: redeem.mutate,
  };
}
