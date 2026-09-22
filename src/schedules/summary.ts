import {
  compareIso,
  formatIntervalLabel,
  sharedFreeDates,
  sharedFreeIntervals,
  type DateInterval,
  type Schedule,
} from '../calendar';

export type MonthRelation = 'past' | 'current' | 'future';
export type PeriodTiming = 'past' | 'current' | 'upcoming';

export interface HighlightedPeriod {
  interval: DateInterval;
  timing: 'current' | 'upcoming';
  label: string;
}

export interface SharedMonthSummary {
  sharedDayCount: number;
  periodCount: number;
  monthRelation: MonthRelation;
  /**
   * The shared period in this month that includes today, or the earliest one
   * that starts later. Absent for a past month, and when none remain.
   */
  nearest: HighlightedPeriod | null;
  intervals: DateInterval[];
}

export function monthRelation(monthStart: string, monthEnd: string, today: string): MonthRelation {
  if (compareIso(monthEnd, today) < 0) return 'past';
  if (compareIso(monthStart, today) > 0) return 'future';
  return 'current';
}

export function periodTiming(interval: DateInterval, today: string): PeriodTiming {
  if (compareIso(interval.end, today) < 0) return 'past';
  if (compareIso(interval.start, today) > 0) return 'upcoming';
  return 'current';
}

export function periodStatusLabel(timing: PeriodTiming, relation: MonthRelation): string {
  if (relation === 'past' && timing !== 'past') return 'Extends beyond this month';
  if (timing === 'past') return 'Passed';
  if (timing === 'current') return 'Includes today';
  return 'Upcoming';
}

/** One status sentence. It never names a date the engine did not return. */
export function summaryStatusText(summary: SharedMonthSummary, monthLabel: string): string {
  if (summary.sharedDayCount === 0) {
    if (summary.monthRelation === 'past') {
      return `No shared free days in ${monthLabel}. This month has passed.`;
    }
    return `No shared free days in ${monthLabel}.`;
  }
  if (summary.monthRelation === 'past') return 'These dates have passed.';
  if (!summary.nearest) return 'No upcoming shared free days remain this month.';
  if (summary.nearest.timing === 'current') return `Includes today: ${summary.nearest.label}.`;
  return `Next: ${summary.nearest.label}.`;
}

export function summarizeSharedMonth(
  personA: Schedule,
  personB: Schedule,
  monthStart: string,
  monthEnd: string,
  today: string,
): SharedMonthSummary {
  const intervals = sharedFreeIntervals(personA, personB, monthStart, monthEnd);
  const sharedDayCount = sharedFreeDates(personA, personB, monthStart, monthEnd).length;
  const relation = monthRelation(monthStart, monthEnd, today);

  let nearest: HighlightedPeriod | null = null;
  if (relation !== 'past') {
    const candidate = intervals.find((interval) => periodTiming(interval, today) !== 'past');
    if (candidate) {
      const timing = periodTiming(candidate, today);
      if (timing !== 'past') {
        nearest = {
          interval: candidate,
          timing,
          label: formatIntervalLabel(candidate.start, candidate.end),
        };
      }
    }
  }

  return {
    sharedDayCount,
    periodCount: intervals.length,
    monthRelation: relation,
    nearest,
    intervals,
  };
}
