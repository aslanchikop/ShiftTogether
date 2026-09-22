import type { Locale, PluralForms } from './types';

export type PluralCategory = keyof PluralForms;

/** Russian uses one/few/many. English uses one/many. Kazakh keeps one noun form. */
export function pluralCategory(locale: Locale, count: number): PluralCategory {
  const value = Math.abs(Math.trunc(count));
  if (locale === 'ru') {
    const mod10 = value % 10;
    const mod100 = value % 100;
    if (mod10 === 1 && mod100 !== 11) return 'one';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
    return 'many';
  }
  if (locale === 'en') return value === 1 ? 'one' : 'many';
  return 'many';
}

export function pluralWord(locale: Locale, count: number, forms: PluralForms): string {
  return forms[pluralCategory(locale, count)];
}

export function quantity(locale: Locale, count: number, forms: PluralForms): string {
  return `${count} ${pluralWord(locale, count, forms)}`;
}
