import { describe, expect, it } from 'vitest';
import { addDays, compareIso, cycleIndex, dayStatus, type Schedule } from '../src/calendar';
import {
  BRIDGE_SEARCH_DAYS,
  findBridgeRecommendations,
  type BridgeRecommendation,
} from '../src/schedules/bridge';

const alwaysFree: Schedule = { type: 'cycle', pattern: ['free'], anchor: '2024-01-01' };
const alwaysWork: Schedule = { type: 'cycle', pattern: ['work'], anchor: '2024-01-01' };

function cycle(pattern: Array<'work' | 'free'>, anchor: string): Schedule {
  return { type: 'cycle', pattern, anchor };
}

function onDate(results: BridgeRecommendation[], date: string): BridgeRecommendation | undefined {
  return results.find((item) => item.date === date);
}

describe('bridge finder', () => {
  it('extends an existing shared-free period by one day, not by the whole run', () => {
    const start = '2024-01-06';
    const personA = cycle(['work', 'free', 'work'], start);
    const results = findBridgeRecommendations(personA, alwaysFree, start);
    const saturday = onDate(results, start);
    expect(saturday?.explanation).toBe('extended-period-after');
    expect(saturday?.originalStatus).toBe('work');
    expect(saturday?.baselineIntervals).toEqual([{ start: '2024-01-07', end: '2024-01-07', days: 1 }]);
    expect(saturday?.resulting).toEqual({ start: '2024-01-06', end: '2024-01-07', days: 2 });
    expect(saturday?.additionalSharedDays).toBe(1);
    expect(saturday?.resulting.days).not.toBe(saturday?.additionalSharedDays);
  });

  it('joins two shared-free periods when one working day sits between them', () => {
    const start = '2024-06-03';
    const personA = cycle(['free', 'work', 'free', 'work'], start);
    const results = findBridgeRecommendations(personA, alwaysFree, start);
    const bridge = onDate(results, '2024-06-04');
    expect(bridge?.person).toBe('a');
    expect(bridge?.explanation).toBe('joined-two-periods');
    expect(bridge?.baselineIntervals).toEqual([
      { start: '2024-06-03', end: '2024-06-03', days: 1 },
      { start: '2024-06-05', end: '2024-06-05', days: 1 },
    ]);
    expect(bridge?.resulting).toEqual({ start: '2024-06-03', end: '2024-06-05', days: 3 });
    expect(bridge?.additionalSharedDays).toBe(1);
    expect(bridge?.baselineLongestDays).toBe(1);
  });

  it('does not recommend a day that is already shared or a day when both are working', () => {
    const start = '2024-04-01';
    const bothFree = findBridgeRecommendations(alwaysFree, alwaysFree, start);
    expect(bothFree).toEqual([]);

    const bothWork = findBridgeRecommendations(alwaysWork, alwaysWork, start);
    expect(bothWork).toEqual([]);

    const onlyWeekdays: Schedule = { type: 'weekdays', workdays: [1, 2, 3, 4, 5] };
    const mixed = findBridgeRecommendations(alwaysWork, onlyWeekdays, '2024-04-01');
    expect(mixed.every((item) => dayStatus(alwaysWork, item.date) === 'work')).toBe(true);
    expect(mixed.every((item) => dayStatus(onlyWeekdays, item.date) === 'free')).toBe(true);
    expect(mixed.some((item) => dayStatus(onlyWeekdays, item.date) === 'work')).toBe(false);
  });

  it('ignores a qualifying day that falls after the 90-day window and keeps the last day inside it', () => {
    const start = '2024-05-01';
    const outside = cycle(
      Array.from({ length: BRIDGE_SEARCH_DAYS + 1 }, (_, index) => (index === BRIDGE_SEARCH_DAYS ? 'work' : 'free')),
      start,
    );
    expect(findBridgeRecommendations(outside, alwaysFree, start)).toEqual([]);

    const edge = cycle(
      Array.from({ length: BRIDGE_SEARCH_DAYS + 1 }, (_, index) => (index === BRIDGE_SEARCH_DAYS - 1 ? 'work' : 'free')),
      start,
    );
    const results = findBridgeRecommendations(edge, alwaysFree, start);
    expect(results.map((item) => item.date)).toEqual([addDays(start, BRIDGE_SEARCH_DAYS - 1)]);
    expect(results[0]?.explanation).toBe('joined-two-periods');
  });

  it('joins shared days across a leap day and across a new year', () => {
    const leap = findBridgeRecommendations(cycle(['free', 'work', 'free', 'work'], '2024-02-28'), alwaysFree, '2024-02-28');
    expect(onDate(leap, '2024-02-29')?.resulting).toEqual({
      start: '2024-02-28',
      end: '2024-03-01',
      days: 3,
    });
    expect(onDate(leap, '2024-02-29')?.additionalSharedDays).toBe(1);

    const year = findBridgeRecommendations(cycle(['free', 'work', 'free', 'work'], '2025-12-31'), alwaysFree, '2025-12-31');
    expect(onDate(year, '2026-01-01')?.resulting).toEqual({
      start: '2025-12-31',
      end: '2026-01-02',
      days: 3,
    });
  });

  it('uses a work day that sits before the anchor because the cycle walks backward', () => {
    const anchor = '2024-03-05';
    const personA = cycle(['free', 'work', 'free', 'work'], anchor);
    expect(cycleIndex(anchor, 4, '2024-03-04')).toBe(3);
    expect(dayStatus(personA, '2024-03-04')).toBe('work');
    const results = findBridgeRecommendations(personA, alwaysFree, '2024-03-03');
    const bridge = onDate(results, '2024-03-04');
    expect(bridge?.explanation).toBe('joined-two-periods');
    expect(bridge?.resulting).toEqual({ start: '2024-03-03', end: '2024-03-05', days: 3 });
    expect(dayStatus(personA, '2024-03-04')).toBe('work');
  });

  it('ranks longer shared runs first, then earlier dates', () => {
    const start = '2024-07-01';
    const pattern: Array<'work' | 'free'> = Array.from({ length: 90 }, (_, index) =>
      [0, 1, 2, 4, 5, 7].includes(index) ? 'free' : 'work',
    );
    const results = findBridgeRecommendations(cycle(pattern, start), alwaysFree, start);
    expect(results[0]).toMatchObject({ date: addDays(start, 3), resulting: { days: 6 }, additionalSharedDays: 1 });
    expect(results[1]).toMatchObject({ date: addDays(start, 6), resulting: { days: 4 }, additionalSharedDays: 1 });
    for (let index = 1; index < results.length; index += 1) {
      const previous = results[index - 1]!;
      const current = results[index]!;
      expect(current.resulting.days).toBeLessThanOrEqual(previous.resulting.days);
      if (current.resulting.days === previous.resulting.days) {
        expect(compareIso(previous.date, current.date)).toBeLessThanOrEqual(0);
      }
    }
    expect(results.every((item) => item.additionalSharedDays === 1)).toBe(true);
  });

  it('returns nothing when neither person can open a shared day', () => {
    const weekdays: Schedule = { type: 'weekdays', workdays: [1, 2, 3, 4, 5, 6, 7] };
    expect(findBridgeRecommendations(alwaysWork, weekdays, '2024-08-01')).toEqual([]);
  });

  it('does not rewrite the schedules it reads', () => {
    const start = '2024-06-03';
    const pattern: Array<'work' | 'free'> = ['free', 'work', 'free'];
    const personA = cycle([...pattern], start);
    findBridgeRecommendations(personA, alwaysFree, start);
    if (personA.type !== 'cycle') throw new Error('expected a cycle');
    expect(personA.pattern).toEqual(pattern);
    expect(dayStatus(personA, '2024-06-04')).toBe('work');
  });
});
