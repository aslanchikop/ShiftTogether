import { describe, expect, it } from 'vitest';
import { localCivilToday } from '../src/ui/today';

describe('local civil today', () => {
  it('reads the local calendar fields and ignores the time of day', () => {
    expect(localCivilToday(new Date(2024, 0, 31, 23, 30))).toBe('2024-01-31');
    expect(localCivilToday(new Date(2024, 1, 29, 0, 5))).toBe('2024-02-29');
    expect(localCivilToday(new Date(2025, 0, 1, 0, 30))).toBe('2025-01-01');
  });
});
