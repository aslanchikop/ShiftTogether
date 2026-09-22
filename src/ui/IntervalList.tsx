import { compareIso, formatIntervalLabel, type DateInterval } from '../calendar';

interface IntervalListProps {
  intervals: DateInterval[];
  monthStart: string;
  monthEnd: string;
  sharedDayCount: number;
  monthLabel: string;
}

export function IntervalList({
  intervals,
  monthStart,
  monthEnd,
  sharedDayCount,
  monthLabel,
}: IntervalListProps) {
  const periodLabel = intervals.length === 1 ? 'period' : 'periods';
  const dayLabel = sharedDayCount === 1 ? 'day' : 'days';

  return (
    <section className="card intervals" aria-labelledby="shared-heading">
      <h2 id="shared-heading">Shared free days</h2>
      <p className="summary">
        {sharedDayCount} shared free {dayLabel} in {monthLabel}, across {intervals.length} {periodLabel}.
      </p>
      {intervals.length === 0 ? (
        <p className="hint">No day in this month is free for both people.</p>
      ) : (
        <ol>
          {intervals.map((interval) => {
            const outside =
              compareIso(interval.start, monthStart) < 0 || compareIso(interval.end, monthEnd) > 0;
            const capped = interval.continuesBefore || interval.continuesAfter;
            return (
              <li key={`${interval.start}:${interval.end}`}>
                <span className="interval-label">{formatIntervalLabel(interval.start, interval.end)}</span>
                <span className="interval-meta">
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
