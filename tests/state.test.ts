import { describe, expect, it } from 'vitest';
import { parseAppState, parsePersonConfig } from '../src/schedules/state';

describe('saved schedule state', () => {
  it('accepts two schedules and a month', () => {
    expect(
      parseAppState({
        year: 2024,
        month: 2,
        personA: {
          name: 'Alex',
          schedule: { type: 'cycle', pattern: ['work', 'free'], anchor: '2024-02-29' },
        },
        personB: {
          name: 'Blair',
          schedule: { type: 'weekdays', workdays: [5, 1, 1, 7] },
        },
      }),
    ).toEqual({
      year: 2024,
      month: 2,
      personA: {
        name: 'Alex',
        schedule: { type: 'cycle', pattern: ['work', 'free'], anchor: '2024-02-29' },
      },
      personB: {
        name: 'Blair',
        schedule: { type: 'weekdays', workdays: [1, 5, 7] },
      },
    });
  });

  it('rejects a non-leap anchor, an empty pattern, and a broken month', () => {
    expect(parsePersonConfig({ name: 'A', schedule: { type: 'cycle', pattern: ['work'], anchor: '2023-02-29' } })).toBe(
      null,
    );
    expect(parsePersonConfig({ name: 'A', schedule: { type: 'cycle', pattern: [], anchor: '2024-01-01' } })).toBe(null);
    expect(
      parseAppState({
        year: 2024,
        month: 13,
        personA: { name: 'A', schedule: { type: 'weekdays', workdays: [1] } },
        personB: { name: 'B', schedule: { type: 'weekdays', workdays: [] } },
      }),
    ).toBe(null);
  });
});
