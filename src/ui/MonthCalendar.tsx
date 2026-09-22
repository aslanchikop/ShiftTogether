import { buildMonthGrid, dayStatus, formatLongDate, WEEKDAY_SHORT, type DayKind } from '../calendar';
import type { PersonConfig } from '../schedules/types';

interface MonthCalendarProps {
  year: number;
  month: number;
  personA: PersonConfig;
  personB: PersonConfig;
  today: string;
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

export function MonthCalendar({ year, month, personA, personB, today }: MonthCalendarProps) {
  const nameA = displayName(personA.name, 'Person A');
  const nameB = displayName(personB.name, 'Person B');
  const cells = buildMonthGrid(year, month);
  const weeks: (typeof cells)[] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return (
    <div className="calendar-wrap">
      <table className="calendar">
        <caption className="sr-only">
          {nameA} and {nameB} in this month
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
                  status === 'shared' ? 'Both' : status === 'free-a' ? 'A' : status === 'free-b' ? 'B' : '';
                return (
                  <td
                    key={cell.date}
                    data-date={cell.date}
                    data-status={status}
                    data-outside={cell.inMonth ? 'false' : 'true'}
                    data-today={cell.date === today ? 'true' : 'false'}
                    aria-label={`${formatLongDate(cell.date)}: ${describe(status, nameA, nameB)}`}
                  >
                    <span className="num">{dayNumber}</span>
                    {label ? <span className="tag">{label}</span> : <span className="tag quiet">Work</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="legend">
        <li data-status="working">
          <span className="swatch" /> Both working
        </li>
        <li data-status="free-a">
          <span className="swatch" /> Only {nameA} free
        </li>
        <li data-status="free-b">
          <span className="swatch" /> Only {nameB} free
        </li>
        <li data-status="shared">
          <span className="swatch" /> Both free
        </li>
      </ul>
    </div>
  );
}
