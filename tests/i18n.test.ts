import { describe, expect, it } from 'vitest';
import { leafEntries, catalogs } from '../src/i18n/catalog';
import {
  bridgeCardCopy,
  formatCivilDate,
  formatMonthCount,
  formatRange,
  formatWeekdaySpan,
  heroKicker,
  horizonEmpty,
  monthTitle,
} from '../src/i18n/format';
import { LANGUAGE_KEY, SCHEDULE_KEY, readLocale, writeLocale, type KeyValueStore } from '../src/i18n/locale';
import { pluralCategory, quantity } from '../src/i18n/plural';
import type { Locale } from '../src/i18n/types';
import { findBridgeRecommendations, type BridgeRecommendation } from '../src/schedules/bridge';
import { findNextSharedPeriod, summarizeSharedMonth } from '../src/schedules/summary';
import type { Schedule as CalSchedule } from '../src/calendar';

const alwaysFree: CalSchedule = { type: 'cycle', pattern: ['free'], anchor: '2024-01-01' };

function memoryStore(seed: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...seed };
  return {
    data,
    getItem: (key) => (key in data ? data[key]! : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

describe('language choice', () => {
  it('defaults to English and stores only the language key', () => {
    const store = memoryStore({ [SCHEDULE_KEY]: '{"personA":"kept"}' });
    expect(readLocale(store)).toBe('en');
    writeLocale(store, 'ru');
    expect(readLocale(store)).toBe('ru');
    expect(store.data[SCHEDULE_KEY]).toBe('{"personA":"kept"}');
    expect(store.data[LANGUAGE_KEY]).toBe('ru');
    expect(LANGUAGE_KEY).not.toBe(SCHEDULE_KEY);
  });

  it('ignores an unknown saved language', () => {
    expect(readLocale(memoryStore({ [LANGUAGE_KEY]: 'fr' }))).toBe('en');
  });
});

describe('translation catalogs', () => {
  it('gives Kazakh and Russian the same keys as English, without copying long English sentences', () => {
    const english = leafEntries(catalogs.en);
    for (const locale of ['ru', 'kk'] as const) {
      const translated = leafEntries(catalogs[locale]);
      expect(translated.map(([key]) => key)).toEqual(english.map(([key]) => key));
      for (const [key, value] of translated) {
        expect(value.trim().length).toBeGreaterThan(0);
        const source = english.find(([englishKey]) => englishKey === key)?.[1] ?? '';
        if (source.length > 12 && !key.endsWith('eyebrow')) {
          expect(value, key).not.toBe(source);
        }
      }
    }
  });
});

describe('civil date wording', () => {
  it('formats dates and weekdays from civil parts', () => {
    expect(formatCivilDate('2024-01-27', 'en')).toBe('Saturday 27 January 2024');
    expect(formatCivilDate('2024-01-27', 'ru')).toBe('суббота, 27 января 2024');
    expect(formatCivilDate('2024-01-27', 'kk')).toBe('сенбі, 27 қаңтар 2024');
    expect(formatRange('2024-10-03', '2024-10-04', '2024-09-22', 'ru')).toBe('3–4 октября');
    expect(formatRange('2024-10-03', '2024-10-04', '2024-09-22', 'kk')).toBe('3–4 қазан');
    expect(formatWeekdaySpan('2024-01-27', '2024-01-28', 'ru')).toBe('суббота–воскресенье');
    expect(monthTitle(2026, 9, 'kk')).toBe('2026 қыркүйек');
    expect(monthTitle(2026, 9, 'ru')).toBe('сентябрь 2026');
    expect(catalogs.en.weekdaysShort[0]).toBe('Mon');
    expect(catalogs.ru.weekdaysLong[0]).toBe('понедельник');
    expect(catalogs.kk.weekdaysLong[0]).toBe('дүйсенбі');
  });

  it('uses Russian plural forms and an invariant Kazakh noun', () => {
    expect(pluralCategory('ru', 1)).toBe('one');
    expect(pluralCategory('ru', 2)).toBe('few');
    expect(pluralCategory('ru', 5)).toBe('many');
    expect(pluralCategory('ru', 11)).toBe('many');
    expect(pluralCategory('ru', 21)).toBe('one');
    expect(quantity('ru', 1, catalogs.ru.quantity.day)).toBe('1 день');
    expect(quantity('ru', 2, catalogs.ru.quantity.day)).toBe('2 дня');
    expect(quantity('ru', 5, catalogs.ru.quantity.day)).toBe('5 дней');
    expect(quantity('kk', 1, catalogs.kk.quantity.day)).toBe('1 күн');
    expect(quantity('kk', 2, catalogs.kk.quantity.day)).toBe('2 күн');
    expect(quantity('kk', 5, catalogs.kk.quantity.day)).toBe('5 күн');
    expect(quantity('en', 1, catalogs.en.quantity.together)).toBe('1 day together');
    expect(quantity('en', 3, catalogs.en.quantity.together)).toBe('3 days together');
  });
});

describe('localized summaries and bridge cards', () => {
  const personA: CalSchedule = { type: 'cycle', pattern: ['free', 'work', 'free', 'work'], anchor: '2024-06-03' };
  const extendA: CalSchedule = { type: 'cycle', pattern: ['work', 'free', 'work'], anchor: '2024-01-06' };

  it('describes an upcoming period and an empty horizon in each language', () => {
    const next = findNextSharedPeriod(
      { type: 'cycle', pattern: ['work', 'work', 'free', 'free'], anchor: '2024-01-01' },
      { type: 'weekdays', workdays: [1, 2, 3, 4, 5] },
      '2024-01-15',
    );
    expect(next).not.toBeNull();
    for (const locale of ['en', 'ru', 'kk'] as Locale[]) {
      expect(heroKicker(next!, '2024-01-15', locale)).toBe(catalogs[locale].hero.next);
      expect(horizonEmpty(locale)).toContain('366');
    }
    expect(horizonEmpty('en')).toBe('No shared free days in the next 366 days.');
    expect(horizonEmpty('ru')).toContain('дней');
    expect(horizonEmpty('kk')).toContain('күн');
    const past = summarizeSharedMonth(personA, alwaysFree, '2024-01-01', '2024-01-31', '2024-02-02');
    expect(formatMonthCount(past, 'январь 2024', 'ru')).toContain('уже прошло');
    expect(formatMonthCount({ ...past, sharedDayCount: 0, periodCount: 0 }, 'март 2024', 'ru')).toBe(
      'В март 2024 нет общих дней.',
    );
  });

  it('names an extension, a join, and a new day without calling the new day an extension', () => {
    const join = findBridgeRecommendations(personA, alwaysFree, '2024-06-03').find((item) => item.date === '2024-06-04');
    const extend = findBridgeRecommendations(extendA, alwaysFree, '2024-01-06').find((item) => item.date === '2024-01-06');
    const created = createdDay();
    expect(join?.explanation).toBe('joined-two-periods');
    expect(extend?.explanation).toBe('extended-period-after');
    expect(created.explanation).toBe('created-period');

    for (const locale of ['en', 'ru', 'kk'] as Locale[]) {
      const joined = bridgeCardCopy(join!, 'Alex', '2024-06-03', locale);
      const longer = bridgeCardCopy(extend!, 'Alex', '2024-01-06', locale);
      const fresh = bridgeCardCopy(created, 'Alex', '2024-08-01', locale);
      expect(joined.effect).toBe(catalogs[locale].bridge.join);
      expect(longer.effect).toBe(catalogs[locale].bridge.extend);
      expect(fresh.effect).toBe(catalogs[locale].bridge.create);
      expect(fresh.effect).not.toBe(longer.effect);
      expect(fresh.total.startsWith('1 ')).toBe(true);
      expect(fresh.gained.startsWith('+1 ')).toBe(true);
      expect(longer.total).not.toBe(longer.gained);
    }
  });
});

function createdDay(): BridgeRecommendation {
  const isolated: CalSchedule = { type: 'cycle', pattern: ['work', 'work', 'work'], anchor: '2024-08-01' };
  const other: CalSchedule = { type: 'cycle', pattern: ['free'], anchor: '2024-08-01' };
  const found = findBridgeRecommendations(isolated, other, '2024-08-01');
  const created = found.find((item) => item.explanation === 'created-period');
  if (!created) throw new Error('expected a new shared day');
  return created;
}
