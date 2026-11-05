import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getLevels, getLoyalty } from '@/api/endpoints';
import { levelState, type LevelState } from '@/utils/levels';

/**
 * Your level, from your lifetime points: Dough, Rising, Golden or Crisp. The
 * server decides (bonus points on orders, which rewards you can redeem);
 * this mirrors it for the screens.
 */
export function useLevel(): LevelState {
  const levelsQuery = useQuery({ queryKey: ['levels'], queryFn: getLevels, staleTime: 60 * 60 * 1000 });
  // Under ['points'], so anything that refreshes the balance refreshes this too.
  const loyaltyQuery = useQuery({ queryKey: ['points', 'loyalty'], queryFn: getLoyalty });

  return useMemo(
    () =>
      levelState(
        levelsQuery.data ?? [],
        loyaltyQuery.data?.lifetimePoints ?? 0,
        loyaltyQuery.data?.firstOrderBonus ?? false,
      ),
    [levelsQuery.data, loyaltyQuery.data],
  );
}
