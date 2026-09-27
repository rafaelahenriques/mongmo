import type { PopUpEvent } from '@/types';
import { popUpToIcs } from '@/utils/ics';

export type CalendarResult = 'added' | 'cancelled' | 'unavailable';

/** Web: downloads an .ics file, which any calendar app opens. */
export async function addToCalendar(event: PopUpEvent): Promise<CalendarResult> {
  const blob = new Blob([popUpToIcs(event)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'mongmo-pop-up'}.ics`;
  link.click();
  URL.revokeObjectURL(url);
  return 'added';
}
