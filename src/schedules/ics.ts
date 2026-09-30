/**
 * iCalendar (RFC 5545) export for shared free intervals.
 *
 * Each interval becomes one all-day VEVENT. The DTEND is the day after the
 * last shared day, because iCalendar dates are exclusive at the end. The
 * system clock is not read: DTSTAMP comes from the caller, so the output is
 * deterministic and testable.
 */

import { addDays, type DateInterval } from '../calendar';

/** Escapes text values: backslash, semicolon, comma, and line breaks. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** '2024-01-27' becomes '20240127'. */
function compactDate(iso: string): string {
  return iso.replaceAll('-', '');
}

/**
 * Folds a long content line at 74 characters, continuing each following
 * line with a single space (RFC 5545 section 3.1). Folding works on code
 * points, so a surrogate pair is never split.
 */
function foldLine(line: string): string {
  const chars = Array.from(line);
  if (chars.length <= 74) return line;
  const segments: string[] = [];
  let index = 0;
  while (index < chars.length) {
    const width = segments.length === 0 ? 74 : 73;
    segments.push(chars.slice(index, index + width).join(''));
    index += width;
  }
  return segments.join('\r\n ');
}

/** A run that reaches the end of the representable range keeps its own day. */
function exclusiveEnd(end: string): string {
  try {
    return addDays(end, 1);
  } catch {
    return end;
  }
}

function uidFor(interval: DateInterval): string {
  return `shifttogether-${compactDate(interval.start)}-${compactDate(interval.end)}@shifttogether.app`;
}

export interface IcsOptions {
  /** Localized event title used for every event in the file. */
  title: string;
  /** Civil date used for DTSTAMP, in YYYY-MM-DD form. */
  stamp: string;
}

/** Builds the whole .ics file text for the given shared intervals. */
export function buildIcsCalendar(intervals: readonly DateInterval[], options: IcsOptions): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ShiftTogether//Shared free days//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const interval of intervals) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uidFor(interval)}`,
      `DTSTAMP:${compactDate(options.stamp)}T000000Z`,
      `DTSTART;VALUE=DATE:${compactDate(interval.start)}`,
      `DTEND;VALUE=DATE:${compactDate(exclusiveEnd(interval.end))}`,
      `SUMMARY:${escapeText(options.title)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
