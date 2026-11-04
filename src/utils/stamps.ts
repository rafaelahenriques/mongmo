/** One stamp on the card is worth this many points, whichever reward is next. */
export const POINTS_PER_STAMP = 25;

/** The card's size when there's no reward to aim for. */
const DEFAULT_STAMPS = 6;

/** How many stamps a reward takes: one per 25 points. */
export function stampsFor(costPoints: number): number {
  return Math.max(1, Math.ceil(costPoints / POINTS_PER_STAMP));
}

/**
 * The stamp card toward the next reward: as many stamps as that reward
 * takes, one filled for every 25 points you have. With nothing left to aim
 * for, a full card.
 */
export function stampCard(points: number, nextReward: { costPoints: number } | null | undefined) {
  if (!nextReward) return { earned: DEFAULT_STAMPS, total: DEFAULT_STAMPS };
  const total = stampsFor(nextReward.costPoints);
  return { earned: Math.min(total, Math.floor(points / POINTS_PER_STAMP)), total };
}

/** "1 stamp = 25 points", said the same way everywhere. */
export const STAMP_VALUE_LABEL = `1 stamp = ${POINTS_PER_STAMP} points`;
