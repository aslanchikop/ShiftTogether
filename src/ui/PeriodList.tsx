import type { DateInterval } from '../calendar';
import { fill, formatRange, formatWeekdaySpan, periodStateLabel } from '../i18n/format';
import { quantity } from '../i18n/plural';
import { useI18n } from '../i18n/useI18n';
import { buildIcsCalendar } from '../schedules/ics';
import { periodTiming, type MonthRelation } from '../schedules/summary';
import { downloadTextFile } from './download';

interface PeriodListProps {
  intervals: DateInterval[];
  monthLabel: string;
  monthRelation: MonthRelation;
  today: string;
  nameA: string;
  nameB: string;
  downloadName: string;
}

export function PeriodList({
  intervals,
  monthLabel,
  monthRelation,
  today,
  nameA,
  nameB,
  downloadName,
}: PeriodListProps) {
  const { locale, messages } = useI18n();

  const exportMonth = () => {
    downloadTextFile(
      `${downloadName}.ics`,
      buildIcsCalendar(intervals, {
        title: fill(messages.ics.summary, { nameA, nameB }),
        stamp: today,
      }),
      'text/calendar',
    );
  };

  return (
    <section className="periods" aria-labelledby="periods-heading">
      <div className="section-head">
        <h2 id="periods-heading">{messages.periods.heading}</h2>
        <p>{monthRelation === 'past' ? fill(messages.periods.passed, { month: monthLabel }) : monthLabel}</p>
        {intervals.length === 0 ? null : (
          <button type="button" className="text-button" onClick={exportMonth}>
            {messages.ics.month}
          </button>
        )}
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
