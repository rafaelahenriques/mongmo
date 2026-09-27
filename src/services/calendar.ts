import { hasNativeFeature } from '@/services/nativeModules';
import type { PopUpEvent } from '@/types';

export type CalendarResult = 'added' | 'cancelled' | 'unavailable';

/**
 * Opens the system's own "New event" sheet, filled in with the pop-up. The
 * person picks the calendar and saves — Mongmo never reads their calendar
 * (iOS 17+ needs no calendar permission for this sheet).
 */
export async function addToCalendar(event: PopUpEvent): Promise<CalendarResult> {
  if (!hasNativeFeature('calendar')) return 'unavailable';
  // Loaded on demand: see services/nativeModules.ts.
  const Calendar = await import('expo-calendar/legacy');
  const result = await Calendar.createEventInCalendarAsync({
    title: event.title,
    startDate: new Date(event.startsAt),
    endDate: new Date(event.endsAt),
    location: `${event.venue}, ${event.city}`,
    notes: event.description,
    timeZone: event.timeZone,
  });
  // Android always reports 'done': it can't tell a save from a cancel.
  return result.action === 'canceled' ? 'cancelled' : 'added';
}
