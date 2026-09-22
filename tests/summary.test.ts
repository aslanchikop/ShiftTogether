import { describe, expect, it } from 'vitest';
import type { Schedule } from '../src/calendar';
import {
  monthRelation,
  periodStatusLabel,
  summarizeSharedMonth,
  summaryStatusText,
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

describe('shared month summary', () => {
  it('points at the next period and skips one that already passed', () => {
    const summary = summarizeSharedMonth(twoTwo, weekdays, '2024-01-01', '2024-01-31', '2024-01-15');
    expect(summary.monthRelation).toBe('current');
    expect(summary.sharedDayCount).toBe(4);
    expect(summary.periodCount).toBe(3);
    expect(summary.nearest?.timing).toBe('upcoming');
    expect(summary.nearest?.interval.start).toBe('2024-01-20');
    expect(summaryStatusText(summary, 'January 2024')).toBe('Next: Saturday 20 January 2024.');
  });

  it('calls the period that contains today current, not upcoming', () => {
    const summary = summarizeSharedMonth(twoTwo, weekdays, '2024-01-01', '2024-01-31', '2024-01-27');
    expect(summary.nearest?.timing).toBe('current');
    expect(summary.nearest?.interval).toMatchObject({ start: '2024-01-27', end: '2024-01-28' });
    expect(summaryStatusText(summary, 'January 2024')).toBe('Includes today: 27–28 January 2024.');
  });

  it('does not present an upcoming date for a past month', () => {
    const summary = summarizeSharedMonth(twoTwo, weekdays, '2024-01-01', '2024-01-31', '2024-02-02');
    expect(summary.monthRelation).toBe('past');
    expect(summary.nearest).toBeNull();
    expect(summary.sharedDayCount).toBe(4);
    expect(summaryStatusText(summary, 'January 2024')).toBe('These dates have passed.');
    expect(summaryStatusText(summary, 'January 2024')).not.toMatch(/Next|Includes today/);
  });

  it('treats a future month as upcoming and names the earliest period', () => {
    const summary = summarizeSharedMonth(twoTwo, weekdays, '2024-01-01', '2024-01-31', '2023-12-15');
    expect(summary.monthRelation).toBe('future');
    expect(summary.nearest?.timing).toBe('upcoming');
    expect(summary.nearest?.interval.start).toBe('2024-01-07');
    expect(summaryStatusText(summary, 'January 2024')).toBe('Next: Sunday 7 January 2024.');
  });

  it('says when the current month has shared days but none left', () => {
    const summary = summarizeSharedMonth(twoTwo, weekdays, '2024-01-01', '2024-01-31', '2024-01-29');
    expect(summary.nearest).toBeNull();
    expect(summaryStatusText(summary, 'January 2024')).toBe('No upcoming shared free days remain this month.');
  });

  it('uses an empty state without inventing a date', () => {
    const current = summarizeSharedMonth(alwaysWork, weekdays, '2024-01-01', '2024-01-31', '2024-01-15');
    const past = summarizeSharedMonth(alwaysWork, weekdays, '2024-01-01', '2024-01-31', '2024-03-01');
    expect(current.sharedDayCount).toBe(0);
    expect(current.nearest).toBeNull();
    expect(summaryStatusText(current, 'January 2024')).toBe('No shared free days in January 2024.');
    expect(summaryStatusText(past, 'January 2024')).toBe(
      'No shared free days in January 2024. This month has passed.',
    );
  });

  it('keeps a run that started before the month when it includes today', () => {
    const both: Schedule = {
      type: 'cycle',
      pattern: ['free', 'free', 'free', 'work', 'work', 'work', 'work'],
      anchor: '2023-12-31',
    };
    const summary = summarizeSharedMonth(both, both, '2024-01-01', '2024-01-31', '2024-01-01');
    expect(summary.nearest?.timing).toBe('current');
    expect(summary.nearest?.interval.start).toBe('2023-12-31');
    expect(summary.nearest?.interval.end).toBe('2024-01-02');
  });

  it('classifies month edges and avoids an upcoming label on a past month', () => {
    expect(monthRelation('2024-01-01', '2024-01-31', '2024-01-01')).toBe('current');
    expect(monthRelation('2024-01-01', '2024-01-31', '2024-01-31')).toBe('current');
    expect(monthRelation('2024-01-01', '2024-01-31', '2024-02-01')).toBe('past');
    expect(monthRelation('2024-01-01', '2024-01-31', '2023-12-31')).toBe('future');
    expect(periodStatusLabel('upcoming', 'past')).toBe('Extends beyond this month');
    expect(periodStatusLabel('past', 'current')).toBe('Passed');
    expect(periodStatusLabel('current', 'current')).toBe('Includes today');
    expect(periodStatusLabel('upcoming', 'future')).toBe('Upcoming');
  });
});
