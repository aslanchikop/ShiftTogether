import type { DateInterval } from '../calendar';
import { fill, formatRange, formatWeekdaySpan, periodStateLabel } from '../i18n/format';
import { quantity } from '../i18n/plural';
import { useI18n } from '../i18n/LocaleProvider';
import { periodTiming, type MonthRelation } from '../schedules/summary';

interface PeriodListProps {
  intervals: DateInterval[];
  monthLabel: string;
  monthRelation: MonthRelation;
  today: string;
}

export function PeriodList({ intervals, monthLabel, monthRelation, today }: PeriodListProps) {
  const { locale, messages } = useI18n();

  return (
    <section className="periods" aria-labelledby="periods-heading">
      <div className="section-head">
        <h2 id="periods-heading">{messages.periods.heading}</h2>
        <p>{monthRelation === 'past' ? fill(messages.periods.passed, { month: monthLabel }) : monthLabel}</p>
      </div>
      {intervals.length === 0 ? (
        <p className="quiet">{fill(messages.periods.empty, { month: monthLabel })}</p>
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
                <span className="period-length">{quantity(locale, interval.days, messages.quantity.day)}</span>
                <span className="period-copy">
                  <span className="period-range">{formatRange(interval.start, interval.end, today, locale)}</span>
                  <span className="period-span">{formatWeekdaySpan(interval.start, interval.end, locale)}</span>
                </span>
                <span className="period-state">{periodStateLabel(timing, locale)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
