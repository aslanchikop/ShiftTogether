import { describe, expect, it } from 'vitest';
import {
  MAX_SHARED_RUN_DAYS,
  addDays,
  daysBetween,
  sharedFreeDates,
  sharedFreeIntervals,
  type Schedule,
} from '../src/calendar';

/**
 * Worked example: Person A works 2/2 from Monday 1 January 2024.
 * Person B works Monday–Friday.
 * Shared free days in January 2024 are 7, 20, 27 and 28.
 */
const personA: Schedule = {
  type: 'cycle',
  pattern: ['work', 'work', 'free', 'free'],
  anchor: '2024-01-01',
};

const personB: Schedule = {
  type: 'weekdays',
  workdays: [1, 2, 3, 4, 5],
};

describe('shared free time', () => {
  it('finds the January 2024 overlap of a 2/2 cycle and Monday–Friday', () => {
    expect(sharedFreeDates(personA, personB, '2024-01-01', '2024-01-31')).toEqual([
      '2024-01-07',
      '2024-01-20',
      '2024-01-27',
      '2024-01-28',
    ]);
    expect(sharedFreeIntervals(personA, personB, '2024-01-01', '2024-01-31')).toEqual([
      interval('2024-01-07', '2024-01-07'),
      interval('2024-01-20', '2024-01-20'),
      interval('2024-01-27', '2024-01-28'),
    ]);
  });

  it('overlaps cycles of different lengths', () => {
    const alternate: Schedule = { type: 'cycle', pattern: ['work', 'free'], anchor: '2024-01-01' };
    const three: Schedule = { type: 'cycle', pattern: ['work', 'work', 'free'], anchor: '2024-01-01' };
    expect(sharedFreeDates(alternate, three, '2024-01-01', '2024-01-12')).toEqual(['2024-01-06', '2024-01-12']);
    expect(sharedFreeIntervals(alternate, three, '2024-01-01', '2024-01-12').map((item) => item.start)).toEqual([
      '2024-01-06',
      '2024-01-12',
    ]);
  });

  it('keeps one interval when shared free days cross into a new year', () => {
    const both: Schedule = {
      type: 'cycle',
      pattern: ['work', 'free', 'free', 'work', 'work'],
      anchor: '2025-12-30',
    };
    expect(sharedFreeIntervals(both, both, '2026-01-01', '2026-01-02')).toEqual([
      interval('2025-12-31', '2026-01-01'),
    ]);
    expect(sharedFreeIntervals(both, both, '2025-12-30', '2025-12-31')).toEqual([
      interval('2025-12-31', '2026-01-01'),
    ]);
  });

  it('includes 29 February inside a shared free interval', () => {
    const both: Schedule = {
      type: 'cycle',
      pattern: ['free', 'free', 'free', 'work'],
      anchor: '2024-02-28',
    };
    expect(sharedFreeIntervals(both, both, '2024-03-01', '2024-03-02')).toEqual([
      interval('2024-02-28', '2024-03-01'),
    ]);
    expect(sharedFreeDates(both, both, '2024-02-28', '2024-03-02')).toEqual([
      '2024-02-28',
      '2024-02-29',
      '2024-03-01',
    ]);
  });

  it('does not merge shared days that have a working day between them', () => {
    const both: Schedule = {
      type: 'cycle',
      pattern: ['free', 'work', 'free', 'work', 'work', 'work', 'work'],
      anchor: '2024-06-01',
    };
    const intervals = sharedFreeIntervals(both, both, '2024-06-01', '2024-06-03');
    expect(intervals).toEqual([interval('2024-06-01', '2024-06-01'), interval('2024-06-03', '2024-06-03')]);
  });

  it('caps an unbounded shared run and reports that it continues', () => {
    const always: Schedule = { type: 'cycle', pattern: ['free'], anchor: '2024-01-01' };
    const [run] = sharedFreeIntervals(always, always, '2024-01-01', '2024-01-31');
    expect(run).toEqual({
      start: addDays('2024-01-01', -MAX_SHARED_RUN_DAYS),
      end: addDays('2024-01-31', MAX_SHARED_RUN_DAYS),
      days: 31 + MAX_SHARED_RUN_DAYS * 2,
      continuesBefore: true,
      continuesAfter: true,
    });
  });

  it('returns no intervals when the two schedules never share a free day in range', () => {
    const alwaysWork: Schedule = { type: 'cycle', pattern: ['work'], anchor: '2024-01-01' };
    expect(sharedFreeIntervals(alwaysWork, personB, '2024-01-01', '2024-03-31')).toEqual([]);
    expect(sharedFreeDates(personA, personB, '2024-01-08', '2024-01-12')).toEqual([]);
  });
});

function interval(start: string, end: string) {
  return {
    start,
    end,
    days: daysBetween(start, end) + 1,
    continuesBefore: false,
    continuesAfter: false,
  };
}
