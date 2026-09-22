import { describe, expect, it } from 'vitest';
import { addDays, dayStatus, parseIsoDate, type Schedule } from '../src/calendar';
import {
  FORWARD_SEARCH_DAYS,
  findNextSharedPeriod,
  formatPeriodRange,
  formatPeriodSpan,
  horizonEmptyText,
  monthCountText,
  monthRelation,
  nextPeriodKicker,
  periodStatusLabel,
  summarizeSharedMonth,
} from '../src/schedules/summary';

const twoTwo: Schedule = {
  type: 'cycle',
  pattern: ['work', 'work', 'free', 'free'],
  anchor: '2024-01-01',
};

const weekdays: Schedule = {
  type: 'weekdays',
  workdays: [1, 2, 3, 4, 5],
};

const alwaysWork: Schedule = { type: 'cycle', pattern: ['work'], anchor: '2024-01-01' };

function firstSharedOnOrAfter(from: string): string {
  let cursor = from;
  while (dayStatus(twoTwo, cursor) !== 'free' || dayStatus(weekdays, cursor) !== 'free') {
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

describe('next shared period', () => {
  it('looks past the end of the month instead of stopping there', () => {
    const today = '2024-01-29';
    const month = summarizeSharedMonth(twoTwo, weekdays, '2024-01-01', '2024-01-31', today);
    const next = findNextSharedPeriod(twoTwo, weekdays, today);
    const expectedStart = firstSharedOnOrAfter(today);

    expect(month.sharedDayCount).toBe(4);
    expect(month.periodCount).toBe(3);
    expect(parseIsoDate(expectedStart).month).not.toBe(1);
    expect(next?.timing).toBe('upcoming');
    expect(next?.interval.start).toBe(expectedStart);
    expect(nextPeriodKicker(next!, today)).toBe('Your next days together');
  });

  it('keeps the same next period when the question is not tied to a displayed month', () => {
    const today = '2024-01-15';
    const january = summarizeSharedMonth(twoTwo, weekdays, '2024-01-01', '2024-01-31', today);
    const march = summarizeSharedMonth(twoTwo, weekdays, '2024-03-01', '2024-03-31', today);
    const next = findNextSharedPeriod(twoTwo, weekdays, today);

    expect(january.sharedDayCount).not.toBe(march.sharedDayCount);
    expect(next?.interval.start).toBe('2024-01-20');
    expect(next?.timing).toBe('upcoming');
    expect(formatPeriodRange(next!.interval.start, next!.interval.end, today)).toBe('20 January');
    expect(formatPeriodSpan(next!.interval.start, next!.interval.end, next!.interval.days)).toBe(
      '1 day · Saturday',
    );
  });

  it('treats a period already under way as now, including one that started earlier', () => {
    const today = '2024-01-27';
    const next = findNextSharedPeriod(twoTwo, weekdays, today);
    expect(next?.timing).toBe('current');
    expect(next?.interval).toMatchObject({ start: '2024-01-27', end: '2024-01-28', days: 2 });
    expect(formatPeriodRange('2024-01-27', '2024-01-28', today)).toBe('27–28 January');
    expect(formatPeriodSpan('2024-01-27', '2024-01-28', 2)).toBe('2 days · Saturday–Sunday');
    expect(nextPeriodKicker(next!, today)).toBe('You are both free now');
  });

  it('names a one-day period that is today', () => {
    const bothToday: Schedule = { type: 'cycle', pattern: ['free', 'work'], anchor: '2024-05-04' };
    const next = findNextSharedPeriod(bothToday, bothToday, '2024-05-04');
    expect(next?.timing).toBe('current');
    expect(next?.interval.days).toBe(1);
    expect(nextPeriodKicker(next!, '2024-05-04')).toBe('You are both free today');
  });

  it('says when the forward search finds nothing, and includes a period on the last searched day', () => {
    expect(findNextSharedPeriod(alwaysWork, weekdays, '2024-01-15')).toBeNull();
    expect(horizonEmptyText()).toBe(`No shared free days in the next ${FORWARD_SEARCH_DAYS} days.`);

    const onHorizon: Schedule = {
      type: 'cycle',
      pattern: [...Array.from({ length: FORWARD_SEARCH_DAYS }, () => 'work' as const), 'free'],
      anchor: '2024-06-01',
    };
    const found = findNextSharedPeriod(onHorizon, onHorizon, '2024-06-01');
    expect(found?.interval.start).toBe(addDays('2024-06-01', FORWARD_SEARCH_DAYS));
    expect(found?.timing).toBe('upcoming');

    const pastHorizon: Schedule = {
      type: 'cycle',
      pattern: [...Array.from({ length: FORWARD_SEARCH_DAYS + 1 }, () => 'work' as const), 'free'],
      anchor: '2024-06-01',
    };
    expect(findNextSharedPeriod(pastHorizon, pastHorizon, '2024-06-01')).toBeNull();
  });

  it('formats a range that crosses a year', () => {
    expect(formatPeriodRange('2025-12-31', '2026-01-02', '2025-12-20')).toBe(
      '31 December 2025 – 2 January 2026',
    );
    expect(formatPeriodRange('2024-10-03', '2024-10-04', '2024-09-22')).toBe('3–4 October');
  });
});

describe('selected month summary', () => {
  it('counts shared days in the month without calling them the next period', () => {
    const summary = summarizeSharedMonth(twoTwo, weekdays, '2024-01-01', '2024-01-31', '2024-02-02');
    expect(summary.monthRelation).toBe('past');
    expect(summary.sharedDayCount).toBe(4);
    expect(summary.periodCount).toBe(3);
    expect(monthCountText(summary, 'January 2024')).toBe(
      '4 shared days in January 2024 · 3 periods · already passed',
    );
  });

  it('describes an empty month without inventing a date', () => {
    const summary = summarizeSharedMonth(alwaysWork, weekdays, '2024-03-01', '2024-03-31', '2024-03-10');
    expect(summary.sharedDayCount).toBe(0);
    expect(summary.intervals).toEqual([]);
    expect(monthCountText(summary, 'March 2024')).toBe('No shared days in March 2024.');
  });

  it('classifies month edges and period timing against today', () => {
    expect(monthRelation('2024-01-01', '2024-01-31', '2024-01-01')).toBe('current');
    expect(monthRelation('2024-01-01', '2024-01-31', '2024-01-31')).toBe('current');
    expect(monthRelation('2024-01-01', '2024-01-31', '2024-02-01')).toBe('past');
    expect(monthRelation('2024-01-01', '2024-01-31', '2023-12-31')).toBe('future');
    expect(periodStatusLabel('past')).toBe('Past');
    expect(periodStatusLabel('current')).toBe('Now');
    expect(periodStatusLabel('upcoming')).toBe('Upcoming');
  });
});
