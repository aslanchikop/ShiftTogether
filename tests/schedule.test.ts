import { describe, expect, it } from 'vitest';
import { addDays, cycleIndex, dayStatus, type Schedule } from '../src/calendar';

const twoTwo = (anchor: string): Schedule => ({
  type: 'cycle',
  pattern: ['work', 'work', 'free', 'free'],
  anchor,
});

const weekdays = (workdays: number[]): Schedule => ({ type: 'weekdays', workdays });

describe('schedule status', () => {
  it('repeats a 2/2 cycle forward from the anchor', () => {
    const schedule = twoTwo('2024-01-01');
    expect(dayStatus(schedule, '2024-01-01')).toBe('work');
    expect(dayStatus(schedule, '2024-01-02')).toBe('work');
    expect(dayStatus(schedule, '2024-01-03')).toBe('free');
    expect(dayStatus(schedule, '2024-01-04')).toBe('free');
    expect(dayStatus(schedule, '2024-01-05')).toBe('work');
  });

  it('wraps a negative offset when the cycle began before the date', () => {
    const schedule: Schedule = {
      type: 'cycle',
      pattern: ['work', 'free', 'free'],
      anchor: '2024-03-01',
    };
    expect(cycleIndex('2024-03-01', 3, '2024-02-28')).toBe(1);
    expect(dayStatus(schedule, '2024-02-28')).toBe('free');
    expect(dayStatus(schedule, '2024-02-27')).toBe('work');
    expect(dayStatus(schedule, '2024-02-26')).toBe('free');
    expect(dayStatus(schedule, addDays('2024-03-01', -3))).toBe('work');
  });

  it('keeps a cycle aligned across February 29', () => {
    const schedule: Schedule = {
      type: 'cycle',
      pattern: ['work', 'free', 'free'],
      anchor: '2024-02-28',
    };
    expect(dayStatus(schedule, '2024-02-28')).toBe('work');
    expect(dayStatus(schedule, '2024-02-29')).toBe('free');
    expect(dayStatus(schedule, '2024-03-01')).toBe('free');
    expect(dayStatus(schedule, '2024-03-02')).toBe('work');

    const nonLeap: Schedule = { ...schedule, anchor: '2023-02-28' };
    expect(dayStatus(nonLeap, '2023-02-28')).toBe('work');
    expect(dayStatus(nonLeap, '2023-03-01')).toBe('free');
    expect(dayStatus(nonLeap, '2023-03-02')).toBe('free');
    expect(dayStatus(nonLeap, '2023-03-03')).toBe('work');
  });

  it('keeps a cycle aligned from December into January', () => {
    const schedule: Schedule = {
      type: 'cycle',
      pattern: ['work', 'work', 'free', 'free'],
      anchor: '2025-12-30',
    };
    expect(dayStatus(schedule, '2025-12-30')).toBe('work');
    expect(dayStatus(schedule, '2025-12-31')).toBe('work');
    expect(dayStatus(schedule, '2026-01-01')).toBe('free');
    expect(dayStatus(schedule, '2026-01-02')).toBe('free');
    expect(dayStatus(schedule, '2026-01-03')).toBe('work');
  });

  it('treats Monday–Friday as work and the weekend as free, including a leap day', () => {
    const schedule = weekdays([1, 2, 3, 4, 5]);
    expect(dayStatus(schedule, '2024-01-01')).toBe('work');
    expect(dayStatus(schedule, '2024-01-05')).toBe('work');
    expect(dayStatus(schedule, '2024-01-06')).toBe('free');
    expect(dayStatus(schedule, '2024-01-07')).toBe('free');
    expect(dayStatus(schedule, '2024-02-29')).toBe('work');
    expect(dayStatus(schedule, '2024-03-02')).toBe('free');
  });

  it('supports a Sunday–Thursday week and an arbitrary pattern', () => {
    const sunThu = weekdays([7, 1, 2, 3, 4]);
    expect(dayStatus(sunThu, '2024-01-07')).toBe('work');
    expect(dayStatus(sunThu, '2024-01-06')).toBe('free');

    const custom: Schedule = {
      type: 'cycle',
      pattern: ['work', 'free', 'work'],
      anchor: '2024-05-01',
    };
    expect(dayStatus(custom, '2024-05-01')).toBe('work');
    expect(dayStatus(custom, '2024-05-02')).toBe('free');
    expect(dayStatus(custom, '2024-05-03')).toBe('work');
    expect(dayStatus(custom, '2024-05-04')).toBe('work');
  });

  it('uses a cycle that starts before the displayed month', () => {
    const schedule = twoTwo('2023-12-31');
    expect(dayStatus(schedule, '2024-01-01')).toBe('work');
    expect(dayStatus(schedule, '2024-01-02')).toBe('free');
    expect(dayStatus(schedule, '2024-01-03')).toBe('free');
    expect(dayStatus(schedule, '2024-01-04')).toBe('work');
  });
});
