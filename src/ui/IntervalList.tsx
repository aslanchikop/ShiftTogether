import { compareIso, formatIntervalLabel, type DateInterval } from '../calendar';
import { periodStatusLabel, periodTiming, type MonthRelation } from '../schedules/summary';

interface IntervalListProps {
  intervals: DateInterval[];
  monthStart: string;
  monthEnd: string;
  monthRelation: MonthRelation;
  today: string;
}

export function IntervalList({ intervals, monthStart, monthEnd, monthRelation, today }: IntervalListProps) {
  return (
    <section className="card intervals" aria-labelledby="periods-heading">
      <h2 id="periods-heading">Shared periods</h2>
      {intervals.length === 0 ? (
        <p className="hint">No shared free days to list.</p>
      ) : (
        <ol>
          {intervals.map((interval) => {
            const outside = compareIso(interval.start, monthStart) < 0 || compareIso(interval.end, monthEnd) > 0;
            const capped = interval.continuesBefore || interval.continuesAfter;
            const timing = periodTiming(interval, today);
            return (
              <li key={`${interval.start}:${interval.end}`}>
                <span className="interval-label">{formatIntervalLabel(interval.start, interval.end)}</span>
                <span className="interval-meta">
                  <span className={`when when-${timing}`}>{periodStatusLabel(timing, monthRelation)}</span>
                  {' · '}
                  {interval.days} {interval.days === 1 ? 'day' : 'days'}
                  {outside ? ' · includes days outside this month' : ''}
                  {capped ? ' · longer than the searched window' : ''}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
