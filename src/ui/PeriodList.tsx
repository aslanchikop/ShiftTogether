import {
  formatPeriodRange,
  formatWeekdaySpan,
  periodStatusLabel,
  periodTiming,
  type MonthRelation,
} from '../schedules/summary';
import type { DateInterval } from '../calendar';

interface PeriodListProps {
  intervals: DateInterval[];
  monthLabel: string;
  monthRelation: MonthRelation;
  today: string;
}

export function PeriodList({ intervals, monthLabel, monthRelation, today }: PeriodListProps) {
  return (
    <section className="periods" aria-labelledby="periods-heading">
      <div className="section-head">
        <h2 id="periods-heading">This month</h2>
        <p>{monthRelation === 'past' ? `${monthLabel} has passed` : monthLabel}</p>
      </div>
      {intervals.length === 0 ? (
        <p className="quiet">No shared free days in {monthLabel}.</p>
      ) : (
        <ul className="period-list">
          {intervals.map((interval) => {
            const timing = periodTiming(interval, today);
            const several = interval.days > 1;
            return (
              <li
                key={`${interval.start}:${interval.end}`}
                className={`period ${several ? 'period-several' : 'period-one'} timing-${timing}`}
              >
                <span className="period-length">{interval.days === 1 ? '1 day' : `${interval.days} days`}</span>
                <span className="period-copy">
                  <span className="period-range">{formatPeriodRange(interval.start, interval.end, today)}</span>
                  <span className="period-span">{formatWeekdaySpan(interval.start, interval.end)}</span>
                </span>
                <span className="period-state">{periodStatusLabel(timing)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
