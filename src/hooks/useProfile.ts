import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getProfile, setLeaderboardVisible } from '@/api/endpoints';

/** The signed-in user's profile (cached with the rest of the API cache). */
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
  });
}

/** Flips the "show me on the leaderboard" privacy toggle (server-side). */
export function useSetLeaderboardVisible() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (visible: boolean) => setLeaderboardVisible(visible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
