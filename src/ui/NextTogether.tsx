import { compareIso, parseIsoDate } from '../calendar';
import {
  fill,
  formatMonthCount,
  formatPeriodSpan,
  formatRange,
  heroKicker,
  horizonEmpty,
} from '../i18n/format';
import { useI18n } from '../i18n/LocaleProvider';
import type { NextSharedPeriod, SharedMonthSummary } from '../schedules/summary';

interface NextTogetherProps {
  next: NextSharedPeriod | null;
  summary: SharedMonthSummary;
  monthLabel: string;
  monthStart: string;
  monthEnd: string;
  today: string;
  onShowPeriod: (year: number, month: number) => void;
}

export function NextTogether({
  next,
  summary,
  monthLabel,
  monthStart,
  monthEnd,
  today,
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

  return (
    <section className={`hero hero-${next.timing}`} id="next-together" aria-labelledby="next-heading">
      <p className="kicker" id="next-heading">
        {heroKicker(next, today, locale)}
      </p>
      <p className="hero-date">{formatRange(interval.start, interval.end, today, locale)}</p>
      <p className="hero-span">{formatPeriodSpan(interval.start, interval.end, interval.days, locale)}</p>
      <p className="hero-month">{monthLine}</p>
      {overlapsMonth ? null : (
        <button type="button" className="text-button" onClick={() => onShowPeriod(start.year, start.month)}>
          {fill(messages.hero.showDate, { date: formatRange(interval.start, interval.start, today, locale) })}
        </button>
      )}
    </section>
  );
}
