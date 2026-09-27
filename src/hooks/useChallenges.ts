import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { completeChallenge, getChallenges, getMyChallengeCompletions } from '@/api/challenges';
import { haptics } from '@/services/haptics';

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
    mutationFn: ({ challengeId, data }: { challengeId: string; data?: Record<string, unknown> }) =>
      completeChallenge(challengeId, data),
    // Returning the completions refetch keeps the mutation pending until the
    // challenge actually shows as done, so there's no gap where it can be
    // started again.
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ['badges', 'earned'] });
      queryClient.invalidateQueries({ queryKey: ['points'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      return queryClient.invalidateQueries({ queryKey: ['challenge-completions'] });
    },
    onError: () => haptics.error(),
  });

  return {
    challenges: challengesQuery.data ?? [],
    isLoading: challengesQuery.isPending || completionsQuery.isPending,
    isError: challengesQuery.isError,
    completedByChallenge,
    complete: complete.mutate,
    completePending: complete.isPending,
  };
}
