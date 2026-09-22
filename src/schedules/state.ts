import { isIsoDate, type DayKind } from '../calendar';
import type { AppState, PersonConfig } from './types';

const STORAGE_KEY = 'shifttogether.v1';
const MAX_PATTERN = 56;
const MAX_NAME = 40;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length > MAX_NAME) return null;
  return trimmed;
}

function parsePattern(value: unknown): DayKind[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_PATTERN) return null;
  const pattern: DayKind[] = [];
  for (const item of value) {
    if (item !== 'work' && item !== 'free') return null;
    pattern.push(item);
  }
  return pattern;
}

function parseWorkdays(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length > 7) return null;
  const days = new Set<number>();
  for (const item of value) {
    if (typeof item !== 'number' || !Number.isInteger(item) || item < 1 || item > 7) return null;
    days.add(item);
  }
  return [...days].sort((a, b) => a - b);
}

export function parsePersonConfig(value: unknown): PersonConfig | null {
  if (!isRecord(value)) return null;
  const name = parseName(value.name);
  if (name === null || !isRecord(value.schedule)) return null;
  const schedule = value.schedule;
  if (schedule.type === 'cycle') {
    const pattern = parsePattern(schedule.pattern);
    if (!pattern || typeof schedule.anchor !== 'string' || !isIsoDate(schedule.anchor)) return null;
    return { name, schedule: { type: 'cycle', pattern, anchor: schedule.anchor } };
  }
  if (schedule.type === 'weekdays') {
    const workdays = parseWorkdays(schedule.workdays);
    if (!workdays) return null;
    return { name, schedule: { type: 'weekdays', workdays } };
  }
  return null;
}

export function parseAppState(value: unknown): AppState | null {
  if (!isRecord(value)) return null;
  const personA = parsePersonConfig(value.personA);
  const personB = parsePersonConfig(value.personB);
  const { year, month } = value;
  if (!personA || !personB) return null;
  if (typeof year !== 'number' || typeof month !== 'number') return null;
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (year < 1 || year > 9999 || month < 1 || month > 12) return null;
  return { personA, personB, year, month };
}

export function loadAppState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseAppState(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in private browsing. The page still works.
  }
}
