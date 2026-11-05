import { CHALLENGE_POINTS_PER_DAY, orderPoints, POINTS_PER_EURO } from '@/constants/points';

/** The database's rule (0021_levels.sql award_order_points), in integer maths like Postgres. */
function serverOrderPoints(totalCents: number, firstOrder: boolean, bonusPct: number): number {
  if (totalCents <= 0) return 0;
  const base = Math.trunc(totalCents / 10);
  return firstOrder ? base * 2 : base + Math.trunc((base * bonusPct) / 100);
}

describe('orderPoints', () => {
  it('earns 10 points per euro, rounded down', () => {
    expect(POINTS_PER_EURO).toBe(10);
    expect(orderPoints(1000)).toBe(100);
    expect(orderPoints(1050)).toBe(105);
    expect(orderPoints(1059)).toBe(105);
    expect(orderPoints(9)).toBe(0);
  });

  it('doubles the first order', () => {
    expect(orderPoints(1050, { firstOrder: true })).toBe(210);
  });

  it('adds the level bonus, rounded down, but not on top of the first-order double', () => {
    expect(orderPoints(2000, { bonusPct: 10 })).toBe(220);
    expect(orderPoints(1050, { bonusPct: 25 })).toBe(131);
    expect(orderPoints(1000, { firstOrder: true, bonusPct: 50 })).toBe(200);
  });

  it('never goes negative', () => {
    expect(orderPoints(-500)).toBe(0);
  });

  it('agrees with the database for every total up to €200 at every level', () => {
    for (const bonusPct of [0, 10, 25, 50]) {
      for (let cents = 0; cents <= 20_000; cents += 7) {
        expect(orderPoints(cents, { bonusPct })).toBe(serverOrderPoints(cents, false, bonusPct));
        expect(orderPoints(cents, { firstOrder: true })).toBe(serverOrderPoints(cents, true, bonusPct));
      }
    }
  });

  it('keeps the challenge cap the app explains', () => {
    expect(CHALLENGE_POINTS_PER_DAY).toBe(50);
  });
});
