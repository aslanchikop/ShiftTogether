/**
 * Schedule semantics
 *
 * A cycle schedule is an ordered list of work and free days plus an anchor
 * civil date. The anchor is pattern index 0. The next civil day is the next
 * index, wrapping at the end of the pattern. Dates before the anchor walk
 * backward through the pattern, so a cycle that started before the month on
 * screen still lines up.
 *
 * A weekday schedule marks ISO weekdays (Monday = 1 … Sunday = 7) as work.
 * Every other weekday is free. It has no anchor.
 *
 * A date is shared free time when both schedules are free. Consecutive shared
 * dates are one interval, including a run that crosses a month or a year.
 * When the requested range is only part of a longer run, the interval keeps
 * the true start and end, up to MAX_SHARED_RUN_DAYS beyond each side.
 */

import { addDays, compareIso, daysBetween, isoWeekday, parseIsoDate } from './civilDate';

export type DayKind = 'work' | 'free';

export interface CycleSchedule {
  type: 'cycle';
  pattern: DayKind[];
  anchor: string;
}

export interface WeekdaySchedule {
  type: 'weekdays';
  /** ISO weekdays that are worked, Monday = 1 … Sunday = 7. */
  workdays: number[];
}

export type Schedule = CycleSchedule | WeekdaySchedule;

export interface DateInterval {
  start: string;
  end: string;
  days: number;
  /** The shared run continues past the search cap before `start`. */
  continuesBefore: boolean;
  /** The shared run continues past the search cap after `end`. */
  continuesAfter: boolean;
}

/** How far an interval may extend outside the requested range. */
export const MAX_SHARED_RUN_DAYS = 400;

function assertSchedule(schedule: Schedule): void {
  if (schedule.type === 'cycle') {
    if (schedule.pattern.length === 0) throw new RangeError('Cycle pattern is empty');
    for (const kind of schedule.pattern) {
      if (kind !== 'work' && kind !== 'free') throw new RangeError('Cycle pattern has an unknown day');
    }
    parseIsoDate(schedule.anchor);
    return;
  }
  for (const day of schedule.workdays) {
    if (!Number.isInteger(day) || day < 1 || day > 7) throw new RangeError('Weekday out of range');
  }
}

/**
 * Pattern index of `date` relative to the anchor.
 * A negative distance wraps to the end of the pattern.
 */
export function cycleIndex(anchor: string, patternLength: number, date: string): number {
  if (!Number.isInteger(patternLength) || patternLength < 1) {
    throw new RangeError('Pattern length must be a positive integer');
  }
  const delta = daysBetween(anchor, date);
  return ((delta % patternLength) + patternLength) % patternLength;
}

export function dayStatus(schedule: Schedule, date: string): DayKind {
  assertSchedule(schedule);
  parseIsoDate(date);
  if (schedule.type === 'weekdays') {
    return schedule.workdays.includes(isoWeekday(date)) ? 'work' : 'free';
  }
  const index = cycleIndex(schedule.anchor, schedule.pattern.length, date);
  return schedule.pattern[index] ?? 'work';
}

export function isSharedFree(a: Schedule, b: Schedule, date: string): boolean {
  return dayStatus(a, date) === 'free' && dayStatus(b, date) === 'free';
}

export function sharedFreeDates(a: Schedule, b: Schedule, rangeStart: string, rangeEnd: string): string[] {
  if (compareIso(rangeStart, rangeEnd) > 0) throw new RangeError('rangeStart is after rangeEnd');
  const dates: string[] = [];
  let cursor = rangeStart;
  while (compareIso(cursor, rangeEnd) <= 0) {
    if (isSharedFree(a, b, cursor)) dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function tryAddDays(iso: string, delta: number): string | null {
  try {
    return addDays(iso, delta);
  } catch {
    return null;
  }
}

function extendRun(
  a: Schedule,
  b: Schedule,
  from: string,
  step: -1 | 1,
): { date: string; capped: boolean } {
  let date = from;
  let moved = 0;
  while (moved < MAX_SHARED_RUN_DAYS) {
    const next = tryAddDays(date, step);
    if (!next || !isSharedFree(a, b, next)) break;
    date = next;
    moved += 1;
  }
  const beyond = tryAddDays(date, step);
  const capped = moved === MAX_SHARED_RUN_DAYS && beyond !== null && isSharedFree(a, b, beyond);
  return { date, capped };
}

/**
 * Shared-free intervals that overlap `[rangeStart, rangeEnd]`.
 * A run that starts before the range or ends after it is returned in full,
 * unless it is longer than the search cap.
 */
export function sharedFreeIntervals(
  a: Schedule,
  b: Schedule,
  rangeStart: string,
  rangeEnd: string,
): DateInterval[] {
  if (compareIso(rangeStart, rangeEnd) > 0) throw new RangeError('rangeStart is after rangeEnd');

  const intervals: DateInterval[] = [];
  let runStart: string | null = null;
  let runEnd: string | null = null;

  const pushRun = (start: string, end: string) => {
    const back = extendRun(a, b, start, -1);
    const forward = extendRun(a, b, end, 1);
    intervals.push({
      start: back.date,
      end: forward.date,
      days: daysBetween(back.date, forward.date) + 1,
      continuesBefore: back.capped,
      continuesAfter: forward.capped,
    });
  };

  let cursor = rangeStart;
  while (compareIso(cursor, rangeEnd) <= 0) {
    if (isSharedFree(a, b, cursor)) {
      if (!runStart) runStart = cursor;
      runEnd = cursor;
    } else if (runStart && runEnd) {
      pushRun(runStart, runEnd);
      runStart = null;
      runEnd = null;
    }
    cursor = addDays(cursor, 1);
  }
  if (runStart && runEnd) pushRun(runStart, runEnd);
  return intervals;
}
