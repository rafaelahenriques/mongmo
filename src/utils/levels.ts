import type { Level } from '@/types';

/** Shown until the levels load (and if they can't): the same ladder as 0021_levels.sql. */
export const FALLBACK_LEVELS: Level[] = [
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
 * Where these lifetime points stand on the ladder: the highest level they
 * reach (the same rule as the database's level_for), the next one, and how
 * far along to it. `levels` is in climbing order; an empty list means the
 * fallback ladder.
 */
export function levelState(levels: Level[], lifetime: number, firstOrderBonus = false): LevelState {
  const ladder = levels.length ? levels : FALLBACK_LEVELS;
  const reachedCount = ladder.filter((level) => lifetime >= level.minPoints).length;
  const current = ladder[Math.max(0, reachedCount - 1)]!;
  const next = ladder[ladder.indexOf(current) + 1] ?? null;
  const byKey = (key: string | null) => ladder.find((level) => level.key === key);

  return {
    levels: ladder,
    lifetime,
    current,
    next,
    toNext: next ? next.minPoints - lifetime : 0,
    progress: next ? (lifetime - current.minPoints) / (next.minPoints - current.minPoints) : 1,
    firstOrderBonus,
    // No level, or one that no longer exists, locks nothing.
    unlocked: (key) => {
      const level = byKey(key);
      return !level || lifetime >= level.minPoints;
    },
    levelName: (key) => byKey(key)?.name ?? '',
  };
}
