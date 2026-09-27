import { API_URL } from '@/constants/config';
import { mockRequest } from '@/api/mock/handlers';
import { ApiError } from '@/api/errors';

function buildUrl(path: string, params?: Record<string, string>): string {
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const entries = params ? Object.entries(params) : [];
  const query = entries.length
    ? `?${entries
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')}`
    : '';
  return `${base}${path}${query}`;
}

/**
 * GET a JSON resource.
 *
 * When `EXPO_PUBLIC_API_URL` is configured the request goes to the real
 * server (abortable, typed, non-2xx → ApiError). Otherwise it is served by
 * the local mock transport with the same semantics, so the fetching layer is
 * real either way.
 */
export async function apiGet<T>(
  path: string,
  params?: Record<string, string>,
  signal?: AbortSignal,
): Promise<T> {
  if (!API_URL) {
    return (await mockRequest(path, params, signal)) as T;
  }

  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new ApiError(`GET ${path} failed with status ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}
