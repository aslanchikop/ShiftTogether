/**
 * Bridge Finder.
 *
 * Looks for one hypothetical day off that would make a longer run of days
 * when both people are free. The stored schedules are never changed.
 * `start` is the first day of a 90-day window. The clock is not read here.
 */

import {
  addDays,
  compareIso,
  daysBetween,
  dayStatus,
  isSharedFree,
  type Schedule,
} from '../calendar';

/** Days examined, including `start`. The last candidate is start + 89 days. */
export const BRIDGE_SEARCH_DAYS = 90;

/** How many ranked suggestions the product shows. */
export const BRIDGE_RESULT_LIMIT = 5;

export type BridgePerson = 'a' | 'b';

export type BridgeExplanation =
  | 'extended-period-before'
  | 'extended-period-after'
  | 'joined-two-periods'
  | 'created-period';

export interface BridgeInterval {
  start: string;
  end: string;
  days: number;
}

export interface BridgeRecommendation {
  person: BridgePerson;
  date: string;
  originalStatus: 'work';
  resulting: BridgeInterval;
  /** Shared runs that already touch the day before and/or the day after. */
  baselineIntervals: BridgeInterval[];
  /** Longest baseline run, or 0 when the day off would start a new run. */
  baselineLongestDays: number;
  /** Dates that are not shared today and would become shared. Not the whole run. */
  additionalSharedDays: number;
  explanation: BridgeExplanation;
}

function tryAdd(iso: string, delta: number): string | null {
  try {
    return addDays(iso, delta);
  } catch {
    return null;
  }
}

function interval(start: string, end: string): BridgeInterval {
  return { start, end, days: daysBetween(start, end) + 1 };
}

function existingRun(personA: Schedule, personB: Schedule, from: string, step: -1 | 1): BridgeInterval | null {
  if (!isSharedFree(personA, personB, from)) return null;
  let edge = from;
  for (let moved = 0; moved < 400; moved += 1) {
    const next = tryAdd(edge, step);
    if (!next || !isSharedFree(personA, personB, next)) break;
    edge = next;
  }
  return step < 0 ? interval(edge, from) : interval(from, edge);
}

function resultingRun(personA: Schedule, personB: Schedule, date: string): BridgeInterval {
  const shared = (iso: string) => iso === date || isSharedFree(personA, personB, iso);
  let start = date;
  for (let moved = 0; moved < 400; moved += 1) {
    const previous = tryAdd(start, -1);
    if (!previous || !shared(previous)) break;
    start = previous;
  }
  let end = date;
  for (let moved = 0; moved < 400; moved += 1) {
    const next = tryAdd(end, 1);
    if (!next || !shared(next)) break;
    end = next;
  }
  return interval(start, end);
}

function countAdded(personA: Schedule, personB: Schedule, run: BridgeInterval): number {
  let added = 0;
  let cursor = run.start;
  while (compareIso(cursor, run.end) <= 0) {
    if (!isSharedFree(personA, personB, cursor)) added += 1;
    if (cursor === run.end) break;
    const next = tryAdd(cursor, 1);
    if (!next) break;
    cursor = next;
  }
  return added;
}

function consider(
  personA: Schedule,
  personB: Schedule,
  date: string,
  person: BridgePerson,
): BridgeRecommendation | null {
  const worker = person === 'a' ? personA : personB;
  const other = person === 'a' ? personB : personA;
  if (dayStatus(worker, date) !== 'work') return null;
  if (dayStatus(other, date) !== 'free') return null;

  const before = tryAdd(date, -1);
  const after = tryAdd(date, 1);
  const baselineIntervals = [
    before ? existingRun(personA, personB, before, -1) : null,
    after ? existingRun(personA, personB, after, 1) : null,
  ].filter((item): item is BridgeInterval => item !== null);

  const resulting = resultingRun(personA, personB, date);
  const additionalSharedDays = countAdded(personA, personB, resulting);
  const baselineLongestDays = baselineIntervals.reduce((longest, item) => Math.max(longest, item.days), 0);
  if (additionalSharedDays < 1 || resulting.days <= baselineLongestDays) return null;

  let explanation: BridgeExplanation;
  if (baselineIntervals.length === 2) explanation = 'joined-two-periods';
  else if (before && baselineIntervals.some((item) => item.end === before)) explanation = 'extended-period-before';
  else if (baselineIntervals.length === 1) explanation = 'extended-period-after';
  else explanation = 'created-period';

  return {
    person,
    date,
    originalStatus: 'work',
    resulting,
    baselineIntervals,
    baselineLongestDays,
    additionalSharedDays,
    explanation,
  };
}

function better(left: BridgeRecommendation, right: BridgeRecommendation): number {
  if (right.resulting.days !== left.resulting.days) return right.resulting.days - left.resulting.days;
  const byDate = compareIso(left.date, right.date);
  if (byDate !== 0) return byDate;
  return left.person === right.person ? 0 : left.person === 'a' ? -1 : 1;
}

/**
 * Hypothetical single days off, ranked by the length of the shared run they
 * would create, then by earlier date, then Person A before Person B.
 */
export function findBridgeRecommendations(
  personA: Schedule,
  personB: Schedule,
  start: string,
): BridgeRecommendation[] {
  const end = addDays(start, BRIDGE_SEARCH_DAYS - 1);
  const found: BridgeRecommendation[] = [];
  let cursor = start;
  while (compareIso(cursor, end) <= 0) {
    const forA = consider(personA, personB, cursor, 'a');
    const forB = consider(personA, personB, cursor, 'b');
    if (forA) found.push(forA);
    if (forB) found.push(forB);
    if (cursor === end) break;
    const next = tryAdd(cursor, 1);
    if (!next) break;
    cursor = next;
  }

  found.sort(better);
  const unique: BridgeRecommendation[] = [];
  const seen = new Set<string>();
  for (const item of found) {
    const key = `${item.person}:${item.resulting.start}:${item.resulting.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length === BRIDGE_RESULT_LIMIT) break;
  }
  return unique;
}
