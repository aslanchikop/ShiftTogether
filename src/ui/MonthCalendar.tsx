import { buildMonthGrid, dayStatus, formatLongDate, MONTH_NAMES, WEEKDAY_SHORT, type DayKind } from '../calendar';
import type { PersonConfig } from '../schedules/types';

interface MonthCalendarProps {
  year: number;
  month: number;
  personA: PersonConfig;
  personB: PersonConfig;
  today: string;
  onPrevious: () => void;
  onNext: () => void;
  onSelectMonth: (month: number) => void;
  onSelectYear: (year: number) => void;
  minYear: number;
  maxYear: number;
  markedDate?: string | null;
}

type CellStatus = 'shared' | 'free-a' | 'free-b' | 'working';

function displayName(name: string, fallback: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function cellStatus(a: DayKind, b: DayKind): CellStatus {
  if (a === 'free' && b === 'free') return 'shared';
  if (a === 'free') return 'free-a';
  if (b === 'free') return 'free-b';
  return 'working';
}

function describe(status: CellStatus, nameA: string, nameB: string): string {
  if (status === 'shared') return 'both free';
  if (status === 'free-a') return `${nameA} free, ${nameB} working`;
  if (status === 'free-b') return `${nameB} free, ${nameA} working`;
  return 'both working';
}

export function MonthCalendar({
  year,
  month,
  personA,
  personB,
  today,
  onPrevious,
  onNext,
  onSelectMonth,
  onSelectYear,
  minYear,
  maxYear,
  markedDate = null,
}: MonthCalendarProps) {
  const nameA = displayName(personA.name, 'Person A');
  const nameB = displayName(personB.name, 'Person B');
  const cells = buildMonthGrid(year, month);
  const weeks: (typeof cells)[] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  const atStart = year === minYear && month === 1;
  const atEnd = year === maxYear && month === 12;

  return (
    <div className="calendar-wrap">
      <div className="calendar-head">
        <button type="button" aria-label="Previous month" onClick={onPrevious} disabled={atStart}>
          Previous
        </button>
        <div className="month-pick">
          <label>
            <span className="sr-only">Month</span>
            <select aria-label="Month" value={month} onChange={(event) => onSelectMonth(Number(event.target.value))}>
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Year</span>
            <input
              aria-label="Year"
              type="number"
              min={minYear}
              max={maxYear}
              value={year}
              onChange={(event) => {
                const nextYear = Number(event.target.value);
                if (!Number.isInteger(nextYear) || nextYear < minYear || nextYear > maxYear) return;
                onSelectYear(nextYear);
              }}
            />
          </label>
        </div>
        <button type="button" aria-label="Next month" onClick={onNext} disabled={atEnd}>
          Next
        </button>
      </div>
      <table className="calendar">
        <caption className="sr-only">
          {MONTH_NAMES[month - 1]} {year}. {nameA} and {nameB}.
        </caption>
        <thead>
          <tr>
            {WEEKDAY_SHORT.map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]?.date ?? 'week'}>
              {week.map((cell) => {
                const statusA = dayStatus(personA.schedule, cell.date);
                const statusB = dayStatus(personB.schedule, cell.date);
                const status = cellStatus(statusA, statusB);
                const dayNumber = Number(cell.date.slice(8, 10));
                const label =
                  status === 'shared' ? 'Both' : status === 'free-a' ? 'A' : status === 'free-b' ? 'B' : 'Work';
                const todayText = cell.date === today ? ' Today.' : '';
                const outsideText = cell.inMonth ? '' : ' Outside this month.';
                const marked = cell.date === markedDate;
                const markedText = marked ? ' Suggested day off. The schedule is unchanged.' : '';
                return (
                  <td
                    key={cell.date}
                    data-date={cell.date}
                    data-status={status}
                    data-outside={cell.inMonth ? 'false' : 'true'}
                    data-today={cell.date === today ? 'true' : 'false'}
                    data-suggest={marked ? 'true' : 'false'}
                    aria-label={`${formatLongDate(cell.date)}: ${describe(status, nameA, nameB)}.${todayText}${outsideText}${markedText}`}
                  >
                    <span className="num">{dayNumber}</span>
                    <span className={status === 'working' ? 'tag quiet' : 'tag'}>{label}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="legend">
        <li data-status="shared">
          <span className="swatch" /> Both free
        </li>
        <li data-status="free-a">
          <span className="swatch" /> A · only {nameA} free
        </li>
        <li data-status="free-b">
          <span className="swatch" /> B · only {nameB} free
        </li>
        <li data-status="working">
          <span className="swatch" /> Work · both working
        </li>
      </ul>
    </div>
  );
}
