/**
 * The points rules. The database applies them (supabase/migrations/
 * 0018_points_rules.sql, 0021_levels.sql); the app only explains them, so
 * change both.
 */

/** Orders earn this many points per euro paid, once they're picked up. */
export const POINTS_PER_EURO = 10;

/** One stamp on the card. Every reward costs whole stamps. */
export const POINTS_PER_STAMP = 100;

/** Challenges earn at most this many points a day at one pop-up. */
export const CHALLENGE_POINTS_PER_DAY = 50;

/** Your first collected order earns this many times the points. */
export const FIRST_ORDER_MULTIPLIER = 2;

/**
 * What an order of this total earns: 10 points per euro, rounded down;
 * double on your first order, else plus your level's bonus (a percentage).
 */
export function orderPoints(totalCents: number, rules: { firstOrder?: boolean; bonusPct?: number } = {}): number {
  const base = Math.max(0, Math.floor((totalCents * POINTS_PER_EURO) / 100));
  if (rules.firstOrder) return base * FIRST_ORDER_MULTIPLIER;
  return base + Math.floor((base * (rules.bonusPct ?? 0)) / 100);
}
