import { en } from './en';
import { kk } from './kk';
import { ru } from './ru';
import type { Locale, Messages } from './types';

export const catalogs: Record<Locale, Messages> = { en, ru, kk };

export function leafEntries(value: unknown, prefix = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[prefix, value]];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => leafEntries(item, `${prefix}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => leafEntries(item, prefix ? `${prefix}.${key}` : key));
  }
  return [];
}
