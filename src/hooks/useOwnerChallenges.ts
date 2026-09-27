import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getChallenges } from '@/api/challenges';
import { createChallenge, deleteChallenge, updateChallenge, type ChallengeInput } from '@/api/owner';

/** An event's challenges plus the owner's create / edit / remove mutations. */
export function useOwnerChallenges(eventId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['challenges', eventId],
    queryFn: () => getChallenges(eventId),
    enabled: eventId.length > 0,
  });

  // Customers' event screens read the same key, so they see edits at once.
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['challenges', eventId] });

  const create = useMutation({
    mutationFn: (input: ChallengeInput) => createChallenge(eventId, input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ challengeId, input }: { challengeId: string; input: ChallengeInput }) =>
      updateChallenge(challengeId, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (challengeId: string) => deleteChallenge(challengeId),
    onSuccess: invalidate,
  });

  return {
    challenges: query.data ?? [],
    isLoading: query.isPending,
    create,
    update,
    remove,
  };
}
