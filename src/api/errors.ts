import { log } from '@/lib/log';

/** A failed Supabase query/RPC, normalized to an HTTP-style status and a message fit to show. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** PostgREST's "no rows" code for a `.single()` query that matched nothing. */
const NOT_FOUND_CODE = 'PGRST116';

/**
 * Messages written for people: our own database functions raise them
 * (`raise exception 'Not enough points for this reward'` is P0001, P0002
 * for a deleted account). Everything else (a broken rule, a missing grant,
 * a constraint's name) is an internal detail and never shown.
 */
const USER_FACING_CODES = new Set(['P0001', 'P0002']);

/** A value the database refused: too long, wrong format. */
const CHECK_VIOLATION = '23514';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

/**
 * A failed query, RPC or Storage call, as an ApiError with a message safe
 * to show. Internal details go to the log (scrubbed), never to the screen.
 */
export function toApiError(error: { message: string; code?: string }): ApiError {
  if (error.code === NOT_FOUND_CODE) return new ApiError('That couldn’t be found.', 404);
  if (error.code && USER_FACING_CODES.has(error.code)) return new ApiError(error.message, 400);
  log.warn('api', `request failed (${error.code ?? 'no code'}): ${error.message}`);
  if (error.code === CHECK_VIOLATION) return new ApiError('Something there is too long or not allowed.', 400);
  return new ApiError(GENERIC_ERROR_MESSAGE, 500);
}
