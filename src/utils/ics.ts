import type { PopUpEvent } from '@/types';

/** 2026-09-27T18:00:00.000Z → 20260927T180000Z (iCalendar UTC form). */
const utcStamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Text values escape backslashes, commas, semicolons and newlines (RFC 5545 §3.3.11). */
const escapeText = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** Lines longer than 75 characters continue on the next line after a space (§3.1). */
function fold(line: string): string {
  const parts: string[] = [];
  for (let index = 0; index < line.length; index += 73) parts.push(line.slice(index, index + 73));
  return parts.join('\r\n ');
}

/** A one-event calendar file for a pop-up: what "Add to calendar" downloads on the web. */
export function popUpToIcs(event: PopUpEvent, now: Date = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mongmo//Pop-ups//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@mongmo`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(new Date(event.startsAt))}`,
    `DTEND:${utcStamp(new Date(event.endsAt))}`,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(`${event.venue}, ${event.city}`)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `GEO:${event.coordinates.latitude};${event.coordinates.longitude}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
