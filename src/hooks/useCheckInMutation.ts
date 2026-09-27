import { useMutation, useQueryClient } from '@tanstack/react-query';

import { verifyCheckIn } from '@/api/endpoints';
import { useBusyStore } from '@/state/busyStore';

/** Verifies + records a check-in (QR token match, event window, geofence). */
export function useCheckInMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { qrToken: string; coordinates: { latitude: number; longitude: number } }) =>
      verifyCheckIn(eventId, params.qrToken, params.coordinates),
    onSuccess: () => {
      // The server counts the check-in (0009 trigger) and Realtime pushes it
      // to everyone; bump this device's meter now instead of waiting.
      const busy = useBusyStore.getState();
      const current = busy.busy[eventId];
      if (current) busy.setOccupancy(eventId, current.occupancy + 1);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['check-in', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['challenges', eventId] });
      queryClient.invalidateQueries({ queryKey: ['challenge-completions'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['points'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['visited-events'] });
    },
  });
}
