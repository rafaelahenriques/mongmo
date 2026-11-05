import type { Reward } from '@/types';

/** The rewards, cheapest first. */
export function byCost(rewards: Reward[]): Reward[] {
  return [...rewards].sort((a, b) => a.costPoints - b.costPoints);
}

/**
 * The reward to work toward: the cheapest one these points don't cover
 * yet, among those your level opens (a higher level's own rewards wait for
 * it). None when every open reward is already in reach.
 */
export function nextReward(
  rewards: Reward[],
  points: number,
  unlocked: (levelKey: string | null) => boolean,
): Reward | undefined {
  return byCost(rewards).find((reward) => reward.costPoints > points && unlocked(reward.minLevel));
}

/** The best reward these points already cover, among those your level opens. */
export function bestClaimableReward(
  rewards: Reward[],
  points: number,
  unlocked: (levelKey: string | null) => boolean,
): Reward | undefined {
  return byCost(rewards)
    .reverse()
    .find((reward) => reward.costPoints <= points && unlocked(reward.minLevel));
}

/** What a discount takes off an order: its amount, never more than the order. */
export function discountOff(reward: Pick<Reward, 'discountCents'> | null | undefined, subtotalCents: number): number {
  return reward ? Math.min(reward.discountCents ?? 0, subtotalCents) : 0;
}
