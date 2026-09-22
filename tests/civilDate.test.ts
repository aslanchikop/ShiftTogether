import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  addDays,
  buildMonthGrid,
  daysBetween,
  daysInMonth,
  formatIntervalLabel,
  formatIsoDate,
  fromCivilSerial,
  isLeapYear,
  isoWeekday,
  parseIsoDate,
  shiftMonth,
  toCivilSerial,
} from '../src/calendar';

describe('civil dates', () => {
  it('anchors the serial scale on the civil epoch', () => {
    expect(toCivilSerial('1970-01-01')).toBe(0);
    expect(toCivilSerial('1970-01-02')).toBe(1);
    expect(toCivilSerial('1969-12-31')).toBe(-1);
    expect(toCivilSerial('2000-01-01')).toBe(10957);
    expect(fromCivilSerial(0)).toBe('1970-01-01');
    expect(fromCivilSerial(-1)).toBe('1969-12-31');
  });

  it('knows Gregorian leap days', () => {
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(2024)).toBe(true);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(addDays('1900-02-28', 1)).toBe('1900-03-01');
    expect(addDays('2000-02-28', 1)).toBe('2000-02-29');
    expect(addDays('2000-02-29', 1)).toBe('2000-03-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01');
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
    expect(daysBetween('2023-02-28', '2023-03-01')).toBe(1);
  });

  it('crosses December into January', () => {
    expect(addDays('2023-12-31', 1)).toBe('2024-01-01');
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
    expect(addDays('2024-01-01', -1)).toBe('2023-12-31');
    expect(shiftMonth(2024, 12, 1)).toEqual({ year: 2025, month: 1 });
    expect(shiftMonth(2024, 1, -1)).toEqual({ year: 2023, month: 12 });
  });

  it('rejects dates that are not real civil days', () => {
    expect(() => parseIsoDate('2023-02-29')).toThrow(RangeError);
    expect(() => parseIsoDate('2024-02-30')).toThrow(RangeError);
    expect(() => parseIsoDate('2024-13-01')).toThrow(RangeError);
    expect(() => parseIsoDate('2024-00-10')).toThrow(RangeError);
    expect(() => parseIsoDate('2024-04-31')).toThrow(RangeError);
    expect(() => parseIsoDate('2024-1-01')).toThrow(RangeError);
    expect(() => parseIsoDate('0000-01-01')).toThrow(RangeError);
  });

  it('matches a day-by-day Gregorian walk across leap centuries', () => {
    for (const [start, end] of [
      ['1896-01-01', '1905-01-01'],
      ['1996-01-01', '2005-01-01'],
      ['2020-01-01', '2033-01-01'],
    ] as const) {
      let iso = start;
      while (iso !== end) {
        const next = formatIsoDate(stepForward(parseIsoDate(iso)));
        if (addDays(iso, 1) !== next || addDays(next, -1) !== iso || fromCivilSerial(toCivilSerial(iso)) !== iso) {
          throw new Error(`Civil serial diverged at ${iso}`);
        }
        iso = next;
      }
      expect(iso).toBe(end);
    }
  });

  it('numbers weekdays from a known Thursday epoch', () => {
    expect(isoWeekday('1970-01-01')).toBe(4);
    for (const delta of [-400, -7, -1, 0, 1, 3, 4, 59, 366, 1000, 20000]) {
      expect(isoWeekday(addDays('1970-01-01', delta))).toBe(expectedWeekday(delta));
    }
    expect(isoWeekday('2024-01-01')).toBe(1);
    expect(isoWeekday('2024-02-29')).toBe(4);
  });

  it('builds a Monday-first month grid across year boundaries', () => {
    const january2024 = buildMonthGrid(2024, 1);
    expect(january2024.length % 7).toBe(0);
    expect(january2024[0]?.date).toBe('2024-01-01');
    expect(isoWeekday(january2024[0]!.date)).toBe(1);
    expect(january2024.filter((cell) => cell.inMonth)).toHaveLength(31);

    const february2024 = buildMonthGrid(2024, 2);
    expect(february2024[0]?.date).toBe('2024-01-29');
    expect(february2024.filter((cell) => cell.inMonth)).toHaveLength(29);
    expect(february2024.at(-1)?.date).toBe('2024-03-03');

    const january2025 = buildMonthGrid(2025, 1);
    expect(january2025[0]?.date).toBe('2024-12-30');
    expect(january2025[1]?.date).toBe('2024-12-31');
    expect(isoWeekday('2024-12-30')).toBe(1);
    expect(isoWeekday('2025-01-01')).toBe(3);
  });

  it('formats an interval inside one month, across months, and across years', () => {
    expect(formatIntervalLabel('2024-01-27', '2024-01-27')).toBe('Saturday 27 January 2024');
    expect(formatIntervalLabel('2024-01-27', '2024-01-28')).toBe('27–28 January 2024');
    expect(formatIntervalLabel('2024-01-30', '2024-02-02')).toBe('30 January – 2 February 2024');
    expect(formatIntervalLabel('2025-12-31', '2026-01-01')).toBe('31 December 2025 – 1 January 2026');
  });

  it('keeps the calendar engine off the system clock', () => {
    const files = readdirSync(join(process.cwd(), 'src', 'calendar')).filter((name) => name.endsWith('.ts'));
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const source = readFileSync(join(process.cwd(), 'src', 'calendar', name), 'utf8');
      expect(source).not.toMatch(/\bDate\b/);
      expect(source).not.toMatch(/toISOString|getTimezoneOffset|getFullYear|getTime\(/);
    }
  });
});

function stepForward(parts: { year: number; month: number; day: number }) {
  let { year, month, day } = parts;
  day += 1;
  if (day > daysInMonth(year, month)) {
    day = 1;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return { year, month, day };
}

function expectedWeekday(deltaFromThursdayEpoch: number): number {
  const mondayBased = (4 - 1 + deltaFromThursdayEpoch) % 7;
  return ((mondayBased % 7) + 7) % 7 + 1;
}
