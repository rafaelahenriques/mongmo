import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getLevels, getLoyalty } from '@/api/endpoints';
import type { Level } from '@/types';

/** Shown until the levels load (and if they can't): the same ladder as 0021_levels.sql. */
const FALLBACK: Level[] = [
  { key: 'dough', name: 'Dough', minPoints: 0, orderBonusPct: 0, perk: 'Points on every order and challenge' },
  { key: 'rising', name: 'Rising', minPoints: 500, orderBonusPct: 10, perk: '+10% points on orders' },
  { key: 'golden', name: 'Golden', minPoints: 1500, orderBonusPct: 25, perk: '+25% points on orders' },
  { key: 'crisp', name: 'Crisp', minPoints: 4000, orderBonusPct: 50, perk: '+50% points on orders' },
];

export type LevelState = {
  levels: Level[];
  /** Every point ever earned: redeeming doesn't lower it. */
  lifetime: number;
  current: Level;
  next: Level | null;
  /** Lifetime points still needed for the next level (0 at the top). */
  toNext: number;
  /** How far from this level to the next, 0 to 1 (1 at the top). */
  progress: number;
  /** Your next collected order earns double. */
  firstOrderBonus: boolean;
  /** Whether a level's reward is open to you. */
  unlocked: (levelKey: string | null) => boolean;
  levelName: (levelKey: string | null) => string;
};

/**
 * Your level, from your lifetime points: Dough, Rising, Golden or Crisp. The
 * server decides (bonus points on orders, which rewards you can redeem);
 * this mirrors it for the screens.
 */
export function useLevel(): LevelState {
  const levelsQuery = useQuery({ queryKey: ['levels'], queryFn: getLevels, staleTime: 60 * 60 * 1000 });
  // Under ['points'], so anything that refreshes the balance refreshes this too.
  const loyaltyQuery = useQuery({ queryKey: ['points', 'loyalty'], queryFn: getLoyalty });

  return useMemo(() => {
    const levels = levelsQuery.data?.length ? levelsQuery.data : FALLBACK;
    const lifetime = loyaltyQuery.data?.lifetimePoints ?? 0;
    let index = 0;
    levels.forEach((level, i) => {
      if (lifetime >= level.minPoints) index = i;
    });
    const current = levels[index]!;
    const next = levels[index + 1] ?? null;
    const reached = (key: string | null) => {
      if (!key) return true;
      const level = levels.find((candidate) => candidate.key === key);
      return !level || lifetime >= level.minPoints;
    };
    return {
      levels,
      lifetime,
      current,
      next,
      toNext: next ? next.minPoints - lifetime : 0,
      progress: next ? (lifetime - current.minPoints) / (next.minPoints - current.minPoints) : 1,
      firstOrderBonus: loyaltyQuery.data?.firstOrderBonus ?? false,
      unlocked: reached,
      levelName: (key) => levels.find((level) => level.key === key)?.name ?? '',
    };
  }, [levelsQuery.data, loyaltyQuery.data]);
}
