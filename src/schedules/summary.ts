import {
  addDays,
  compareIso,
  isoWeekday,
  parseIsoDate,
  sharedFreeDates,
  sharedFreeIntervals,
  WEEKDAY_NAMES,
  MONTH_NAMES,
  type DateInterval,
  type Schedule,
} from '../calendar';

export type MonthRelation = 'past' | 'current' | 'future';
export type PeriodTiming = 'past' | 'current' | 'upcoming';

/**
 * How far ahead "your next days together" looks.
 * A period that starts on the last day of this window is included.
 * Anything later is outside the search, not proof that none exists.
 */
export const FORWARD_SEARCH_DAYS = 366;

export interface NextSharedPeriod {
  interval: DateInterval;
  timing: 'current' | 'upcoming';
}

export interface SharedMonthSummary {
  sharedDayCount: number;
  periodCount: number;
  monthRelation: MonthRelation;
  intervals: DateInterval[];
}

export function monthRelation(monthStart: string, monthEnd: string, today: string): MonthRelation {
  if (compareIso(monthEnd, today) < 0) return 'past';
  if (compareIso(monthStart, today) > 0) return 'future';
  return 'current';
}

export function periodTiming(interval: DateInterval, today: string): PeriodTiming {
  if (compareIso(interval.end, today) < 0) return 'past';
  if (compareIso(interval.start, today) > 0) return 'upcoming';
  return 'current';
}

export function periodStatusLabel(timing: PeriodTiming): string {
  if (timing === 'past') return 'Past';
  if (timing === 'current') return 'Now';
  return 'Upcoming';
}

/**
 * Earliest shared-free period that includes today or starts after it,
 * searching through today + FORWARD_SEARCH_DAYS.
 * The displayed month is not an input: changing it cannot move this result.
 */
export function findNextSharedPeriod(
  personA: Schedule,
  personB: Schedule,
  today: string,
): NextSharedPeriod | null {
  const horizonEnd = addDays(today, FORWARD_SEARCH_DAYS);
  const intervals = sharedFreeIntervals(personA, personB, today, horizonEnd);
  const candidate = intervals.find((interval) => compareIso(interval.end, today) >= 0);
  if (!candidate) return null;
  const timing = periodTiming(candidate, today);
  if (timing === 'past') return null;
  return { interval: candidate, timing };
}

export function summarizeSharedMonth(
  personA: Schedule,
  personB: Schedule,
  monthStart: string,
  monthEnd: string,
  today: string,
): SharedMonthSummary {
  const intervals = sharedFreeIntervals(personA, personB, monthStart, monthEnd);
  return {
    sharedDayCount: sharedFreeDates(personA, personB, monthStart, monthEnd).length,
    periodCount: intervals.length,
    monthRelation: monthRelation(monthStart, monthEnd, today),
    intervals,
  };
}

/** Compact range such as "3–4 October" or, across years, "31 December 2025 – 1 January 2026". */
export function formatPeriodRange(start: string, end: string, today: string): string {
  const a = parseIsoDate(start);
  const b = parseIsoDate(end);
  const todayYear = parseIsoDate(today).year;
  const sameMonth = a.year === b.year && a.month === b.month;
  const needsYear = a.year !== todayYear || b.year !== todayYear;

  if (start === end) {
    return needsYear ? `${a.day} ${MONTH_NAMES[a.month - 1]} ${a.year}` : `${a.day} ${MONTH_NAMES[a.month - 1]}`;
  }
  if (sameMonth) {
    const year = needsYear ? ` ${a.year}` : '';
    return `${a.day}–${b.day} ${MONTH_NAMES[a.month - 1]}${year}`;
  }
  if (a.year === b.year && !needsYear) {
    return `${a.day} ${MONTH_NAMES[a.month - 1]} – ${b.day} ${MONTH_NAMES[b.month - 1]}`;
  }
  return `${a.day} ${MONTH_NAMES[a.month - 1]} ${a.year} – ${b.day} ${MONTH_NAMES[b.month - 1]} ${b.year}`;
}

export function formatWeekdaySpan(start: string, end: string): string {
  const startName = WEEKDAY_NAMES[isoWeekday(start) - 1] ?? '';
  const endName = WEEKDAY_NAMES[isoWeekday(end) - 1] ?? '';
  return start === end ? startName : `${startName}–${endName}`;
}

/** "2 days · Saturday–Sunday" or "1 day · Saturday". */
export function formatPeriodSpan(start: string, end: string, days: number): string {
  const length = days === 1 ? '1 day' : `${days} days`;
  return `${length} · ${formatWeekdaySpan(start, end)}`;
}

export function monthCountText(summary: SharedMonthSummary, monthLabel: string): string {
  if (summary.sharedDayCount === 0) return `No shared days in ${monthLabel}.`;
  const days = summary.sharedDayCount === 1 ? '1 shared day' : `${summary.sharedDayCount} shared days`;
  const periods = summary.periodCount === 1 ? '1 period' : `${summary.periodCount} periods`;
  const passed = summary.monthRelation === 'past' ? ' · already passed' : '';
  return `${days} in ${monthLabel} · ${periods}${passed}`;
}

export function nextPeriodKicker(next: NextSharedPeriod, today: string): string {
  if (next.timing === 'current' && next.interval.start === today && next.interval.days === 1) {
    return 'You are both free today';
  }
  if (next.timing === 'current') return 'You are both free now';
  return 'Your next days together';
}

export function horizonEmptyText(): string {
  return `No shared free days in the next ${FORWARD_SEARCH_DAYS} days.`;
}
