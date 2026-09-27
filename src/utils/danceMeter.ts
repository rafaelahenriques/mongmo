/** Acceleration (gravity removed) that counts as a dance move, in m/s². */
export const DANCE_MOVE_THRESHOLD = 2.2;

/**
 * How long one move keeps the meter running. Dancing is rhythmic: between
 * beats the acceleration dips below the threshold even though you never
 * stopped, so each move counts for a moment after it.
 */
const MOVE_HOLD_MS = 600;

/**
 * The most one reading can add, so a stall between readings (the app in
 * the background, a dropped frame) isn't counted as dancing.
 */
const MAX_STEP_MS = 250;

export type DanceProgress = {
  /** Milliseconds of dancing so far. */
  activeMs: number;
  /** When the previous reading arrived. */
  lastReadingAt: number | null;
  /** When the last move over the threshold was seen. */
  lastMoveAt: number | null;
};

export const DANCE_START: DanceProgress = { activeMs: 0, lastReadingAt: null, lastMoveAt: null };

/**
 * Adds one motion reading. Time comes from the reading's arrival (`at`, in
 * ms), never from the sensor's own `interval`: on iOS that is in seconds
 * although it's documented as milliseconds.
 */
export function addDanceReading(progress: DanceProgress, force: number, at: number): DanceProgress {
  const step = progress.lastReadingAt === null ? 0 : Math.min(Math.max(at - progress.lastReadingAt, 0), MAX_STEP_MS);
  const lastMoveAt = force >= DANCE_MOVE_THRESHOLD ? at : progress.lastMoveAt;
  const dancing = lastMoveAt !== null && at - lastMoveAt <= MOVE_HOLD_MS;
  return {
    activeMs: progress.activeMs + (dancing ? step : 0),
    lastReadingAt: at,
    lastMoveAt,
  };
}
