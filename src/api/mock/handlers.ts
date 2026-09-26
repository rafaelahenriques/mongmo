import type { EventFilter, PopUpEvent } from '@/types';
import { isThisWeek, isToday } from '@/utils/dateTime';
import { ApiError } from '@/api/errors';
import { getMockEvents, getMockStore } from '@/api/mock/mockData';

/** Simulated network latency so loading states are actually exercised. */
const MOCK_LATENCY_MS = 450;

function createAbortError(): Error {
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(createAbortError());
      },
      { once: true },
    );
  });
}

/** Only events that have not ended yet are relevant to the app. */
function isRelevant(event: PopUpEvent, now: Date): boolean {
  return new Date(event.endsAt).getTime() >= now.getTime();
}

/**
 * Timezone-correct filtering: each event's start time is compared against
 * "now" as seen in the event's own timezone, never the device timezone.
 */
function matchesFilter(event: PopUpEvent, filter: EventFilter, now: Date): boolean {
  if (filter === 'all') {
    return true;
  }
  const start = new Date(event.startsAt);
  if (filter === 'today') {
    return isToday(start, event.timeZone, now);
  }
  return isThisWeek(start, event.timeZone, now);
}

/**
 * Routes mock API requests with the same latency, filtering and error
 * semantics as the real server. The client falls back to this when
 * EXPO_PUBLIC_API_URL is unset.
 */
export async function mockRequest(
  path: string,
  params?: Record<string, string>,
  signal?: AbortSignal,
): Promise<unknown> {
  await delay(MOCK_LATENCY_MS, signal);
  const now = new Date();

  if (path === '/store') {
    return getMockStore();
  }

  if (path === '/events') {
    const rawFilter = params?.filter ?? 'all';
    const filter: EventFilter =
      rawFilter === 'today' || rawFilter === 'week' ? rawFilter : 'all';
    return getMockEvents()
      .filter((event) => isRelevant(event, now))
      .filter((event) => matchesFilter(event, filter, now))
      .sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }

  const eventMatch = /^\/events\/([^/]+)$/.exec(path);
  if (eventMatch) {
    const id = decodeURIComponent(eventMatch[1]);
    const event = getMockEvents().find((candidate) => candidate.id === id);
    if (!event) {
      throw new ApiError(`Event "${id}" not found`, 404);
    }
    return event;
  }

  throw new ApiError(`No mock handler for GET ${path}`, 404);
}
