import type { Reward } from '@/types';
import { bestClaimableReward, byCost, discountOff, nextReward } from '@/utils/rewards';

const reward = (id: string, costPoints: number, minLevel: string | null = null): Reward => ({
  id,
  title: id,
  description: '',
  costPoints,
  discountCents: null,
  expiresAt: null,
  minLevel,
});
const REWARDS = [
  reward('stew', 1200, 'golden'),
  reward('coffee', 300),
  reward('tote', 400, 'rising'),
  reward('roll', 800),
];
const everyone = (key: string | null) => key === null;
const rising = (key: string | null) => key === null || key === 'rising';

describe('rewards', () => {
  it('sorts cheapest first without changing the list it was given', () => {
    expect(byCost(REWARDS).map((r) => r.id)).toEqual(['coffee', 'tote', 'roll', 'stew']);
    expect(REWARDS[0]!.id).toBe('stew');
  });

  it('aims for the cheapest reward not yet covered that your level opens', () => {
    expect(nextReward(REWARDS, 350, everyone)?.id).toBe('roll');
    expect(nextReward(REWARDS, 350, rising)?.id).toBe('tote');
    expect(nextReward(REWARDS, 5000, rising)).toBeUndefined();
  });

  it('offers the best reward the points already cover', () => {
    expect(bestClaimableReward(REWARDS, 900, rising)?.id).toBe('roll');
    expect(bestClaimableReward(REWARDS, 450, everyone)?.id).toBe('coffee');
    expect(bestClaimableReward(REWARDS, 100, rising)).toBeUndefined();
  });

  it('takes a discount off an order, never more than the order', () => {
    expect(discountOff({ discountCents: 500 }, 1200)).toBe(500);
    expect(discountOff({ discountCents: 500 }, 300)).toBe(300);
    expect(discountOff({ discountCents: null }, 1200)).toBe(0);
    expect(discountOff(undefined, 1200)).toBe(0);
  });
});
