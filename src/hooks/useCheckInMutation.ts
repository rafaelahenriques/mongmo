import { useMutation, useQueryClient } from '@tanstack/react-query';

import { verifyCheckIn } from '@/api/endpoints';

/** Verifies + records a check-in (QR token match, event window, geofence). */
export function useCheckInMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { qrToken: string; coordinates: { latitude: number; longitude: number } }) =>
      verifyCheckIn(eventId, params.qrToken, params.coordinates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-in', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['challenges', eventId] });
      queryClient.invalidateQueries({ queryKey: ['challenge-completions'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['badges', 'earned'] });
      queryClient.invalidateQueries({ queryKey: ['points'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['visited-events'] });
    },
  });
}
