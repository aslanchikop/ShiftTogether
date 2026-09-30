import { compareIso, parseIsoDate } from '../calendar';
import { fill, formatMonthCount, formatPeriodSpan, formatRange, heroKicker, horizonEmpty } from '../i18n/format';
import { useI18n } from '../i18n/useI18n';
import { buildIcsCalendar } from '../schedules/ics';
import type { NextSharedPeriod, SharedMonthSummary } from '../schedules/summary';
import { downloadTextFile } from './download';

interface NextTogetherProps {
  next: NextSharedPeriod | null;
  summary: SharedMonthSummary;
  monthLabel: string;
  monthStart: string;
  monthEnd: string;
  today: string;
  nameA: string;
  nameB: string;
  onShowPeriod: (year: number, month: number) => void;
}

export function NextTogether({
  next,
  summary,
  monthLabel,
  monthStart,
  monthEnd,
  today,
  nameA,
  nameB,
  onShowPeriod,
}: NextTogetherProps) {
  const { locale, messages } = useI18n();
  const monthLine = formatMonthCount(summary, monthLabel, locale);

  if (!next) {
    return (
      <section className="hero hero-empty" id="next-together" aria-labelledby="next-heading">
        <p className="kicker" id="next-heading">
          {messages.hero.next}
        </p>
        <p className="hero-empty-copy">{horizonEmpty(locale)}</p>
        <p className="hero-month">{monthLine}</p>
      </section>
    );
  }

  const { interval } = next;
  const overlapsMonth = compareIso(interval.end, monthStart) >= 0 && compareIso(interval.start, monthEnd) <= 0;
  const start = parseIsoDate(interval.start);

  const exportIcs = () => {
    downloadTextFile(
      `shifttogether-${interval.start}.ics`,
      buildIcsCalendar([interval], {
        title: fill(messages.ics.summary, { nameA, nameB }),
        stamp: today,
      }),
      'text/calendar',
    );
  };

  return (
    <section className={`hero hero-${next.timing}`} id="next-together" aria-labelledby="next-heading">
      <p className="kicker" id="next-heading">
        {heroKicker(next, today, locale)}
      </p>
      <p className="hero-date">{formatRange(interval.start, interval.end, today, locale)}</p>
      <p className="hero-span">{formatPeriodSpan(interval.start, interval.end, interval.days, locale)}</p>
      <p className="hero-month">{monthLine}</p>
      <div className="hero-actions">
        {overlapsMonth ? null : (
          <button type="button" className="text-button" onClick={() => onShowPeriod(start.year, start.month)}>
            {fill(messages.hero.showDate, { date: formatRange(interval.start, interval.start, today, locale) })}
          </button>
        )}
        <button type="button" className="text-button" onClick={exportIcs}>
          {messages.ics.save}
        </button>
      </div>
    </section>
  );
}
