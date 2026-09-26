import { apiGet } from '@/api/client';
import type { EventFilter, PopUpEvent, Store } from '@/types';

/** GET /store — the single permanent Mongmo location. */
export function getStore(signal?: AbortSignal): Promise<Store> {
  return apiGet<Store>('/store', undefined, signal);
}

/** GET /events?filter=… — temporary pop-ups, filterable by date. */
export function getEvents(filter: EventFilter, signal?: AbortSignal): Promise<PopUpEvent[]> {
  return apiGet<PopUpEvent[]>('/events', { filter }, signal);
}

/** GET /events/:id — a single event (detail screen / push deep link). */
export function getEvent(id: string, signal?: AbortSignal): Promise<PopUpEvent> {
  return apiGet<PopUpEvent>(`/events/${encodeURIComponent(id)}`, undefined, signal);
}
