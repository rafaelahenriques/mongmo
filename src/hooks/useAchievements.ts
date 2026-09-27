import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getAchievements } from '@/api/endpoints';
import { useActivityStore } from '@/state/activityStore';
import { summarizeActivity } from '@/utils/achievements';

/**
 * Everything the achievements screen needs: server-owned copy (badge
 * catalog, rewards) plus locally derived stats from the activity store.
 */
export function useAchievements() {
  const query = useQuery({
    queryKey: ['achievements'],
    queryFn: ({ signal }) => getAchievements(signal),
  });

  const checkIns = useActivityStore((state) => state.checkIns);
  const shares = useActivityStore((state) => state.shares);
  const redemptions = useActivityStore((state) => state.redemptions);
  const redeemReward = useActivityStore((state) => state.redeemReward);

  const summary = useMemo(
    () => summarizeActivity({ checkIns, shares, redemptions }),
    [checkIns, shares, redemptions],
  );

  return { query, summary, redemptions, redeemReward };
}
