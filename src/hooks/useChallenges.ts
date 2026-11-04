import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { completeChallenge, getChallenges, getCompletionPoints, getMyChallengeCompletions } from '@/api/challenges';
import { getAchievements, getEarnedBadges, getPointsBalance } from '@/api/endpoints';
import { haptics } from '@/services/haptics';
import type { BadgeDefinition } from '@/types';

/** What a completion brought: its points, the new balance and any badge it unlocked. */
export type CompletionOutcome = {
  /** What it earned (less than the challenge's own once the day's cap is hit); null if unknown. */
  points: number | null;
  balance: number | null;
  badge: BadgeDefinition | null;
};

/** An event's challenges, the signed-in user's completions, and a mutation to complete one. */
export function useChallenges(eventId: string) {
  const queryClient = useQueryClient();

  const challengesQuery = useQuery({
    queryKey: ['challenges', eventId],
    queryFn: () => getChallenges(eventId),
    enabled: eventId.length > 0,
  });

  const completionsQuery = useQuery({
    queryKey: ['challenge-completions'],
    queryFn: () => getMyChallengeCompletions(),
  });

  const completedByChallenge = useMemo(
    () => new Map(completionsQuery.data?.map((completion) => [completion.challengeId, completion])),
    [completionsQuery.data],
  );

  const complete = useMutation({
    mutationFn: async ({
      challengeId,
      data,
    }: {
      challengeId: string;
      data?: Record<string, unknown>;
    }): Promise<CompletionOutcome> => {
      // Same keys and fetchers as useAchievements, so they share the cache.
      const earnedQuery = { queryKey: ['badges', 'earned'], queryFn: () => getEarnedBadges() };
      const before = await queryClient.ensureQueryData(earnedQuery).catch(() => null);

      const completionId = await completeChallenge(challengeId, data);

      // The points and badges screen after it: best effort, the completion
      // itself already counted.
      const [points, balance, earned, catalog] = await Promise.all([
        completionId ? getCompletionPoints(completionId).catch(() => null) : null,
        queryClient.fetchQuery({ queryKey: ['points'], queryFn: () => getPointsBalance() }).catch(() => null),
        queryClient.fetchQuery(earnedQuery).catch(() => null),
        queryClient.ensureQueryData({ queryKey: ['achievements'], queryFn: () => getAchievements() }).catch(() => null),
      ]);
      const had = new Set(before?.map((badge) => badge.badgeId));
      const unlocked = before ? earned?.find((badge) => !had.has(badge.badgeId)) : undefined;
      const badge = unlocked
        ? (catalog?.badges.find((definition) => definition.id === unlocked.badgeId) ?? null)
        : null;
      return { points, balance, badge };
    },
    // Returning the completions refetch keeps the mutation pending until the
    // challenge actually shows as done, so there's no gap where it can be
    // started again.
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ['badges', 'progress'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['points', 'history'] });
      return queryClient.invalidateQueries({ queryKey: ['challenge-completions'] });
    },
    onError: () => haptics.error(),
  });

  return {
    challenges: challengesQuery.data ?? [],
    isLoading: challengesQuery.isPending || completionsQuery.isPending,
    isError: challengesQuery.isError,
    refetch: challengesQuery.refetch,
    completedByChallenge,
    complete: complete.mutate,
    completePending: complete.isPending,
  };
}
