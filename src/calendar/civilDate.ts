/**
 * Proleptic Gregorian civil dates as ISO strings (YYYY-MM-DD).
 *
 * Day arithmetic uses Howard Hinnant's civil serial (days since 1970-01-01)
 * so a calendar day never shifts because of a time zone or a UTC timestamp.
 * This module does not read the system clock.
 */

export interface CivilDateParts {
  year: number;
  month: number;
  day: number;
}

export const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_YEAR = 1;
const MAX_YEAR = 9999;

export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new RangeError(`Month out of range: ${month}`);
  }
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

export function formatIsoDate(parts: CivilDateParts): string {
  if (!Number.isInteger(parts.year) || !Number.isInteger(parts.month) || !Number.isInteger(parts.day)) {
    throw new RangeError('Civil date parts must be integers');
  }
  const year = String(parts.year).padStart(4, '0');
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(iso: string): CivilDateParts {
  const match = ISO_DATE.exec(iso);
  if (!match) throw new RangeError(`Invalid civil date: ${iso}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`Invalid civil date: ${iso}`);
  }
  return { year, month, day };
}

export function isIsoDate(value: string): boolean {
  try {
    parseIsoDate(value);
    return true;
  } catch {
    return false;
  }
}

/** Days since the civil date 1970-01-01. Earlier dates are negative. */
export function toCivilSerial(iso: string): number {
  const { year, month, day } = parseIsoDate(iso);
  let y = year;
  if (month <= 2) y -= 1;
  const era = Math.trunc((y >= 0 ? y : y - 399) / 400);
  const yearOfEra = y - era * 400;
  const dayOfYear = Math.trunc((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra = yearOfEra * 365 + Math.trunc(yearOfEra / 4) - Math.trunc(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

export function fromCivilSerial(serial: number): string {
  if (!Number.isInteger(serial)) throw new RangeError('Civil serial must be an integer');
  const z = serial + 719468;
  const era = Math.trunc((z >= 0 ? z : z - 146096) / 146097);
  const dayOfEra = z - era * 146097;
  const yearOfEra = Math.trunc(
    (dayOfEra - Math.trunc(dayOfEra / 1460) + Math.trunc(dayOfEra / 36524) - Math.trunc(dayOfEra / 146096)) / 365,
  );
  const y = yearOfEra + era * 400;
  const dayOfYear = dayOfEra - (365 * yearOfEra + Math.trunc(yearOfEra / 4) - Math.trunc(yearOfEra / 100));
  const monthPart = Math.trunc((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.trunc((153 * monthPart + 2) / 5) + 1;
  const month = monthPart < 10 ? monthPart + 3 : monthPart - 9;
  const year = y + (month <= 2 ? 1 : 0);
  if (year < MIN_YEAR || year > MAX_YEAR) {
    throw new RangeError('Civil day is outside 0001-01-01..9999-12-31');
  }
  return formatIsoDate({ year, month, day });
}

export function addDays(iso: string, delta: number): string {
  if (!Number.isInteger(delta)) throw new RangeError('Day offset must be an integer');
  return fromCivilSerial(toCivilSerial(iso) + delta);
}

/** Serial of `to` minus serial of `from`. Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return toCivilSerial(to) - toCivilSerial(from);
}

/** Negative when `a` is earlier than `b`, zero when equal, positive when `a` is later. */
export function compareIso(a: string, b: string): number {
  return toCivilSerial(a) - toCivilSerial(b);
}

/** ISO weekday: Monday = 1 … Sunday = 7. 1970-01-01 is Thursday. */
export function isoWeekday(iso: string): number {
  const serial = toCivilSerial(iso);
  const mondayBased = (serial + 3) % 7;
  return ((mondayBased + 7) % 7) + 1;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(delta)) {
    throw new RangeError('Month shift requires integers');
  }
  if (month < 1 || month > 12) throw new RangeError(`Month out of range: ${month}`);
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = index - nextYear * 12 + 1;
  return { year: nextYear, month: nextMonth };
}

export interface CalendarCell {
  date: string;
  inMonth: boolean;
}

/** Monday-first grid covering the month, including days from adjacent months. */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  if (year < MIN_YEAR || year > MAX_YEAR) throw new RangeError(`Year out of range: ${year}`);
  const first = formatIsoDate({ year, month, day: 1 });
  const leading = isoWeekday(first) - 1;
  const start = addDays(first, -leading);
  const total = Math.ceil((leading + daysInMonth(year, month)) / 7) * 7;
  const cells: CalendarCell[] = [];
  for (let i = 0; i < total; i += 1) {
    const date = addDays(start, i);
    const parts = parseIsoDate(date);
    cells.push({ date, inMonth: parts.year === year && parts.month === month });
  }
  return cells;
}

export function formatLongDate(iso: string): string {
  const { year, month, day } = parseIsoDate(iso);
  const weekday = WEEKDAY_NAMES[isoWeekday(iso) - 1];
  return `${weekday} ${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatIntervalLabel(start: string, end: string): string {
  if (compareIso(start, end) > 0) throw new RangeError('Interval start is after end');
  if (start === end) return formatLongDate(start);
  const a = parseIsoDate(start);
  const b = parseIsoDate(end);
  if (a.year === b.year && a.month === b.month) {
    return `${a.day}–${b.day} ${MONTH_NAMES[a.month - 1]} ${a.year}`;
  }
  if (a.year === b.year) {
    return `${a.day} ${MONTH_NAMES[a.month - 1]} – ${b.day} ${MONTH_NAMES[b.month - 1]} ${a.year}`;
  }
  return `${a.day} ${MONTH_NAMES[a.month - 1]} ${a.year} – ${b.day} ${MONTH_NAMES[b.month - 1]} ${b.year}`;
}
