import { compareIso, parseIsoDate } from '../calendar';
import {
  formatPeriodRange,
  formatPeriodSpan,
  horizonEmptyText,
  monthCountText,
  nextPeriodKicker,
  type NextSharedPeriod,
  type SharedMonthSummary,
} from '../schedules/summary';

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
  const monthLine = monthCountText(summary, monthLabel);

  if (!next) {
    return (
      <section className="hero hero-empty" id="next-together" aria-labelledby="next-heading">
        <p className="kicker" id="next-heading">
          Your next days together
        </p>
        <p className="hero-empty-copy">{horizonEmptyText()}</p>
        <p className="hero-month">{monthLine}</p>
      </section>
    );
  }

  const { interval, timing } = next;
  const overlapsMonth = compareIso(interval.end, monthStart) >= 0 && compareIso(interval.start, monthEnd) <= 0;
  const start = parseIsoDate(interval.start);

  return (
    <section className={`hero hero-${timing}`} id="next-together" aria-labelledby="next-heading">
      <p className="kicker" id="next-heading">
        {nextPeriodKicker(next, today)}
      </p>
      <p className="hero-date">{formatPeriodRange(interval.start, interval.end, today)}</p>
      <p className="hero-span">{formatPeriodSpan(interval.start, interval.end, interval.days)}</p>
      <p className="hero-month">{monthLine}</p>
      {overlapsMonth ? null : (
        <button
          type="button"
          className="text-button"
          onClick={() => onShowPeriod(start.year, start.month)}
        >
          Show {formatPeriodRange(interval.start, interval.start, today)} on the calendar
        </button>
      )}
    </section>
  );
}
