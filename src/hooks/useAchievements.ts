import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getAchievements,
  getBadgeProgress,
  getEarnedBadges,
  getPointsBalance,
  getProfileStats,
  getUserRewards,
  redeemReward,
} from '@/api/endpoints';
import { useNow } from '@/hooks/useNow';
import type { EarnedBadge, Reward } from '@/types';

/** A reward the user has redeemed and not used yet. */
export type UsableReward = { userRewardId: string; reward: Reward };

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

  const progressQuery = useQuery({
    queryKey: ['badges', 'progress'],
    queryFn: () => getBadgeProgress(),
  });

  const redeem = useMutation({
    mutationFn: (rewardId: string) => redeemReward(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points'] });
      queryClient.invalidateQueries({ queryKey: ['user-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
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

  // Hourly is plenty to drop a reward that has just expired.
  const now = useNow(60 * 60_000).getTime();
  const usableRewards = useMemo<UsableReward[]>(() => {
    const catalog = new Map((query.data?.rewards ?? []).map((reward) => [reward.id, reward]));
    return (userRewardsQuery.data ?? []).flatMap((entry) => {
      const reward = catalog.get(entry.reward_id);
      const expired = reward?.expiresAt ? Date.parse(reward.expiresAt) < now : false;
      return reward && !entry.used_at && !expired ? [{ userRewardId: entry.id, reward }] : [];
    });
  }, [query.data, userRewardsQuery.data, now]);

  return {
    query,
    summary,
    userRewards: userRewardsQuery.data ?? [],
    /** Redeemed, unused, unexpired rewards. */
    usableRewards,
    /** Progress towards each badge, by badge key. */
    progress: progressQuery.data ?? {},
    redeemReward: redeem.mutate,
  };
}
