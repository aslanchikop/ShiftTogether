import { describe, expect, it } from 'vitest';
import { sharedFreeIntervals, type Schedule } from '../src/calendar';
import { buildIcsCalendar } from '../src/schedules/ics';

const twoTwo: Schedule = { type: 'cycle', pattern: ['work', 'work', 'free', 'free'], anchor: '2024-01-01' };
const weekdays: Schedule = { type: 'weekdays', workdays: [1, 2, 3, 4, 5] };

/** 2/2 versus Monday-Friday in January 2024: shared days 7, 20, and 27-28. */
function monthIntervals() {
  return sharedFreeIntervals(twoTwo, weekdays, '2024-01-01', '2024-01-31');
}

function firstInterval() {
  const single = monthIntervals()[0];
  if (!single) throw new Error('expected a shared interval');
  return single;
}

describe('ics export', () => {
  it('makes one all-day event per shared period, with an exclusive end', () => {
    const text = buildIcsCalendar(monthIntervals(), { title: 'Days together: Alex and Jordan', stamp: '2024-01-10' });
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(text).toContain('DTSTART;VALUE=DATE:20240107');
    expect(text).toContain('DTEND;VALUE=DATE:20240108');
    expect(text).toContain('DTSTART;VALUE=DATE:20240120');
    expect(text).toContain('DTSTART;VALUE=DATE:20240127');
    expect(text).toContain('DTEND;VALUE=DATE:20240129');
  });

  it('wraps events in a published calendar with CRLF line endings', () => {
    const text = buildIcsCalendar(monthIntervals(), { title: 'Together', stamp: '2024-01-10' });
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(text).toContain('VERSION:2.0');
    expect(text).toContain('PRODID:-//ShiftTogether//Shared free days//EN');
    expect(text).toContain('CALSCALE:GREGORIAN');
    expect(text).toContain('METHOD:PUBLISH');
    expect(text).not.toMatch(/(?<!\r)\n/);
  });

  it('uses a stable UID and the given stamp so repeated exports match', () => {
    const first = buildIcsCalendar(monthIntervals(), { title: 'Together', stamp: '2024-01-10' });
    const second = buildIcsCalendar(monthIntervals(), { title: 'Together', stamp: '2024-01-10' });
    expect(first).toBe(second);
    expect(first).toContain('UID:shifttogether-20240107-20240107@shifttogether.app');
    expect(first).toContain('DTSTAMP:20240110T000000Z');
  });

  it('escapes commas, semicolons, backslashes, and line breaks in the summary', () => {
    const text = buildIcsCalendar([firstInterval()], { title: 'A, B; C\\D\nE', stamp: '2024-01-10' });
    expect(text).toContain('SUMMARY:A\\, B\\; C\\\\D\\nE');
  });

  it('folds long lines to at most 75 characters without losing text', () => {
    const title = 'Days together: '.repeat(20);
    const text = buildIcsCalendar([firstInterval()], { title, stamp: '2024-01-10' });
    for (const line of text.split('\r\n')) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
    expect(text.replace(/\r\n /g, '')).toContain(`SUMMARY:${title}`);
  });

  it('writes a calendar without events when there is nothing to share', () => {
    const text = buildIcsCalendar([], { title: 'Together', stamp: '2024-01-10' });
    expect(text).not.toContain('BEGIN:VEVENT');
  });
});
