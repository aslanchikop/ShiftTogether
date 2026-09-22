import { describe, expect, it } from 'vitest';
import type { Schedule } from '../src/calendar';
import { catalogs } from '../src/i18n/catalog';
import { previewComparison } from '../src/i18n/format';
import { LANGUAGE_KEY, SCHEDULE_KEY, writeLocale, type KeyValueStore } from '../src/i18n/locale';
import type { Locale } from '../src/i18n/types';
import { findBridgeRecommendations, type BridgeRecommendation } from '../src/schedules/bridge';
import { createDemoPeople } from '../src/schedules/demo';
import { previewAfterViewChange, reconcilePreview } from '../src/schedules/preview';
import type { AppState } from '../src/schedules/types';

const alwaysFree: Schedule = { type: 'cycle', pattern: ['free'], anchor: '2024-01-01' };

function memory(): KeyValueStore & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

function recommendation(personA: Schedule, personB: Schedule, start: string, date: string): BridgeRecommendation {
  const found = findBridgeRecommendations(personA, personB, start).find((item) => item.date === date);
  if (!found) throw new Error(`missing recommendation ${date}`);
  return found;
}

describe('what-if preview', () => {
  it('previews a recommendation without writing it into the saved schedules', () => {
    const people = createDemoPeople('2024-06-01', { personA: 'Айгерім', personB: 'Нұрлан' });
    const state: AppState = { ...people, year: 2024, month: 6 };
    const saved = JSON.stringify(state);
    const personA: Schedule = { type: 'cycle', pattern: ['free', 'work', 'free', 'work'], anchor: '2024-06-03' };
    const chosen = recommendation(personA, alwaysFree, '2024-06-03', '2024-06-04');
    const session = { recommendation: chosen, returnYear: 2024, returnMonth: 5 };
    expect(previewAfterViewChange(session)).toBe(session);
    expect(JSON.stringify(state)).toBe(saved);
    expect(saved).not.toContain('2024-06-04');
    expect(people.personA.name).toBe('Айгерім');
    expect(personA.pattern).toEqual(['free', 'work', 'free', 'work']);
  });

  it('drops a preview when a schedule edit removes that day off', () => {
    const before: Schedule = { type: 'cycle', pattern: ['free', 'work', 'free', 'work'], anchor: '2024-06-03' };
    const chosen = recommendation(before, alwaysFree, '2024-06-03', '2024-06-04');
    const afterEdit: Schedule = { type: 'cycle', pattern: ['work'], anchor: '2024-06-03' };
    const recomputed = reconcilePreview(chosen, findBridgeRecommendations(afterEdit, alwaysFree, '2024-06-03'));
    expect(recomputed?.date).toBe('2024-06-04');
    expect(recomputed?.explanation).toBe('created-period');
    expect(recomputed?.resulting.days).toBe(1);
    const neitherFree = findBridgeRecommendations(afterEdit, afterEdit, '2024-06-03');
    expect(reconcilePreview(chosen, neitherFree)).toBeNull();
    expect(reconcilePreview(null, neitherFree)).toBeNull();
  });

  it('keeps the preview across a view change and refreshes it when the same day still helps', () => {
    const personA: Schedule = { type: 'cycle', pattern: ['work', 'free', 'work'], anchor: '2024-01-06' };
    const chosen = recommendation(personA, alwaysFree, '2024-01-06', '2024-01-06');
    const session = { recommendation: chosen, returnYear: 2023, returnMonth: 12 };
    expect(previewAfterViewChange(session)?.returnMonth).toBe(12);
    const refreshed = findBridgeRecommendations(personA, alwaysFree, '2024-01-06');
    expect(reconcilePreview(chosen, refreshed)?.date).toBe('2024-01-06');
    expect(reconcilePreview(chosen, refreshed)?.resulting.days).toBe(2);
    expect(reconcilePreview(chosen, refreshed)?.additionalSharedDays).toBe(1);
  });

  it('compares before and after for an extension, a join, and a new day', () => {
    const extend = recommendation(
      { type: 'cycle', pattern: ['work', 'free', 'work'], anchor: '2024-01-06' },
      alwaysFree,
      '2024-01-06',
      '2024-01-06',
    );
    const join = recommendation(
      { type: 'cycle', pattern: ['free', 'work', 'free', 'work'], anchor: '2024-06-03' },
      alwaysFree,
      '2024-06-03',
      '2024-06-04',
    );
    const created = recommendation(
      { type: 'cycle', pattern: ['work', 'work', 'work'], anchor: '2024-08-01' },
      alwaysFree,
      '2024-08-01',
      '2024-08-01',
    );

    const extended = previewComparison(extend, 'Alex', '2024-01-06', 'en');
    expect(extend.explanation).toBe('extended-period-after');
    expect(extended.before).toContain('7 January');
    expect(extended.after).toContain('6–7 January');
    expect(extended.gained).toBe('1 day');
    expect(extend.resulting.days).toBe(2);
    expect(extend.additionalSharedDays).toBe(1);

    const joined = previewComparison(join, 'Alex', '2024-06-03', 'en');
    expect(join.explanation).toBe('joined-two-periods');
    expect(joined.before).toContain('and');
    expect(joined.after).toContain('3–5 June');
    expect(join.resulting.days).toBe(3);
    expect(joined.gained).toBe('1 day');

    const fresh = previewComparison(created, 'Alex', '2024-08-01', 'en');
    expect(created.explanation).toBe('created-period');
    expect(fresh.before).toBe('No shared period');
    expect(fresh.kind).toBe('create');
    expect(fresh.gained).toBe('1 day');
    expect(created.resulting.days).toBe(1);
  });

  it('describes a preview that crosses a year boundary, in every language', () => {
    const year = recommendation(
      { type: 'cycle', pattern: ['free', 'work', 'free', 'work'], anchor: '2025-12-31' },
      alwaysFree,
      '2025-12-31',
      '2026-01-01',
    );
    expect(year.resulting).toEqual({ start: '2025-12-31', end: '2026-01-02', days: 3 });
    expect(year.additionalSharedDays).toBe(1);
    for (const locale of ['en', 'ru', 'kk'] as Locale[]) {
      const comparison = previewComparison(year, 'Alex', '2025-12-20', locale);
      expect(comparison.after).toContain('2025');
      expect(comparison.after).toContain('2026');
      expect(comparison.gained.startsWith('1 ')).toBe(true);
      expect(comparison.cellLabel).toContain('Alex');
      expect(comparison.kind).toBe('join');
      expect(catalogs[locale].preview.exit.length).toBeGreaterThan(3);
      if (locale !== 'en') expect(catalogs[locale].preview.action).not.toBe(catalogs.en.preview.action);
    }
    expect(catalogs.en.preview.action).toBe('Preview this plan');
  });

  it('stores a language change away from the schedule record', () => {
    const store = memory();
    const people = createDemoPeople('2026-09-22', { personA: 'Alex', personB: 'Jordan' });
    store.setItem(SCHEDULE_KEY, JSON.stringify({ ...people, year: 2026, month: 9 }));
    writeLocale(store, 'kk');
    expect(store.getItem(LANGUAGE_KEY)).toBe('kk');
    const saved = JSON.parse(store.getItem(SCHEDULE_KEY) ?? '{}') as AppState;
    expect(saved.personA.name).toBe('Alex');
    expect(saved.personB.name).toBe('Jordan');
    expect(saved.personA.schedule).toEqual(people.personA.schedule);
  });
});
