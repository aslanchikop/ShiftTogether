import type { ReactNode } from 'react';
import { summaryStatusText, type SharedMonthSummary } from '../schedules/summary';

interface SharedSummaryProps {
  summary: SharedMonthSummary;
  monthLabel: string;
  children: ReactNode;
}

export function SharedSummary({ summary, monthLabel, children }: SharedSummaryProps) {
  const dayLabel = summary.sharedDayCount === 1 ? 'day' : 'days';
  const periodLabel = summary.periodCount === 1 ? 'period' : 'periods';
  const status = summaryStatusText(summary, monthLabel);

  return (
    <section className="result" id="shared-summary" aria-labelledby="month-heading">
      <div className="result-top">
        <h2 id="month-heading">{monthLabel}</h2>
        {children}
      </div>
      <div className="result-body">
        <p className="result-count">{summary.sharedDayCount}</p>
        <div>
          <p className="result-title">
            shared free {dayLabel} in {monthLabel}
          </p>
          {summary.sharedDayCount > 0 ? (
            <p className="result-meta">
              {summary.periodCount} {periodLabel}
            </p>
          ) : null}
        </div>
      </div>
      <p className="result-status">{status}</p>
    </section>
  );
}
