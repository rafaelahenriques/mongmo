import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { completeChallenge, getChallenges, getMyChallengeCompletions } from '@/api/challenges';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge-completions'] });
      queryClient.invalidateQueries({ queryKey: ['badges', 'earned'] });
      queryClient.invalidateQueries({ queryKey: ['points'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
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
