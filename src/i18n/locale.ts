import type { Locale } from './types';

export const LANGUAGE_KEY = 'shifttogether.language';
export const SCHEDULE_KEY = 'shifttogether.v1';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function parseLocale(value: string | null): Locale {
  if (value === 'kk' || value === 'ru' || value === 'en') return value;
  return 'en';
}

export function readLocale(store: KeyValueStore | null): Locale {
  if (!store) return 'en';
  return parseLocale(store.getItem(LANGUAGE_KEY));
}

export function writeLocale(store: KeyValueStore, locale: Locale): void {
  store.setItem(LANGUAGE_KEY, locale);
}
