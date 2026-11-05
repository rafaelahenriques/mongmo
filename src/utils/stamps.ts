import { POINTS_PER_STAMP } from '@/constants/points';

/** The card's size when every reward is already in reach. */
const FULL_CARD = 10;

/** How many stamps a reward takes: rewards cost whole stamps. */
export function stampsFor(costPoints: number): number {
  return Math.max(1, Math.ceil(costPoints / POINTS_PER_STAMP));
}

/** "1 stamp", "4 stamps". */
export function stampsLabel(count: number): string {
  return `${count} ${count === 1 ? 'stamp' : 'stamps'}`;
}

/**
 * The stamp card toward the next reward: as many stamps as that reward
 * takes, one filled per 100 points, and how far the next one has filled
 * (0 to 1) with the points left over. With nothing left to aim for, a
 * full card.
 */
export function stampCard(points: number, nextReward: { costPoints: number } | null | undefined) {
  if (!nextReward) return { earned: FULL_CARD, total: FULL_CARD, partial: 0 };
  const total = stampsFor(nextReward.costPoints);
  const earned = Math.min(total, Math.floor(points / POINTS_PER_STAMP));
  const partial = earned < total ? (points % POINTS_PER_STAMP) / POINTS_PER_STAMP : 0;
  return { earned, total, partial };
}

/** "1 stamp = 100 points", said the same way everywhere. */
export const STAMP_VALUE_LABEL = `1 stamp = ${POINTS_PER_STAMP} points`;
