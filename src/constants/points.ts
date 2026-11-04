/**
 * The points rules. The database applies them (supabase/migrations/
 * 0018_points_rules.sql); the app only explains them, so change both.
 */

/** Orders earn this many points per euro paid, once they're picked up. */
export const POINTS_PER_EURO = 10;

/** One stamp on the card. Every reward costs whole stamps. */
export const POINTS_PER_STAMP = 100;

/** Challenges earn at most this many points a day at one pop-up. */
export const CHALLENGE_POINTS_PER_DAY = 50;

/** What an order of this total earns: 10 points per euro, rounded down. */
export function orderPoints(totalCents: number): number {
  return Math.max(0, Math.floor((totalCents * POINTS_PER_EURO) / 100));
}
