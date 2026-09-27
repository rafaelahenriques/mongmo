/** A failed Supabase query/RPC, normalized to an HTTP-style status. */
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

/** A failed query, RPC or Storage call, as an ApiError carrying the server's message. */
export function toApiError(error: { message: string; code?: string }): ApiError {
  return new ApiError(error.message, error.code === NOT_FOUND_CODE ? 404 : 500);
}
