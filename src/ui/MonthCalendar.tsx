import { buildMonthGrid, compareIso, dayStatus, type DayKind } from '../calendar';
import { fill, formatCivilDate } from '../i18n/format';
import { useI18n } from '../i18n/LocaleProvider';
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
  preview?: {
    date: string;
    start: string;
    end: string;
    cell: string;
    cellLabel: string;
    spanLabel: string;
  } | null;
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

function describe(
  status: CellStatus,
  nameA: string,
  nameB: string,
  bothFree: string,
  bothWorking: string,
  freeName: string,
): string {
  if (status === 'shared') return bothFree;
  if (status === 'free-a') return fill(freeName, { name: nameA, other: nameB });
  if (status === 'free-b') return fill(freeName, { name: nameB, other: nameA });
  return bothWorking;
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
  preview = null,
}: MonthCalendarProps) {
  const { locale, messages } = useI18n();
  const nameA = displayName(personA.name, messages.schedules.fallbackA);
  const nameB = displayName(personB.name, messages.schedules.fallbackB);
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
        <button type="button" aria-label={messages.calendar.previous} onClick={onPrevious} disabled={atStart}>
          {messages.calendar.previous}
        </button>
        <div className="month-pick">
          <label>
            <span className="sr-only">{messages.calendar.month}</span>
            <select aria-label={messages.calendar.month} value={month} onChange={(event) => onSelectMonth(Number(event.target.value))}>
              {messages.months.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">{messages.calendar.year}</span>
            <input
              aria-label={messages.calendar.year}
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
        <button type="button" aria-label={messages.calendar.next} onClick={onNext} disabled={atEnd}>
          {messages.calendar.next}
        </button>
      </div>
      <table className="calendar">
        <caption className="sr-only">
          {fill(messages.calendar.caption, { month: messages.months[month - 1] ?? '', year, nameA, nameB })}
        </caption>
        <thead>
          <tr>
            {messages.weekdaysShort.map((label) => (
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
                const proposed = preview?.date === cell.date;
                const inPreviewSpan =
                  preview !== null &&
                  !proposed &&
                  compareIso(cell.date, preview.start) >= 0 &&
                  compareIso(cell.date, preview.end) <= 0;
                const label = proposed
                  ? preview.cell
                  : status === 'shared'
                    ? messages.calendar.both
                    : status === 'free-a'
                      ? messages.calendar.personA
                      : status === 'free-b'
                        ? messages.calendar.personB
                        : messages.calendar.work;
                const todayText = cell.date === today ? ` ${messages.calendar.today}` : '';
                const outsideText = cell.inMonth ? '' : ` ${messages.calendar.outside}`;
                const previewText = proposed ? ` ${preview.cellLabel}` : inPreviewSpan ? ` ${preview.spanLabel}` : '';
                return (
                  <td
                    key={cell.date}
                    data-date={cell.date}
                    data-status={status}
                    data-outside={cell.inMonth ? 'false' : 'true'}
                    data-today={cell.date === today ? 'true' : 'false'}
                    data-preview={proposed ? 'proposed' : inPreviewSpan ? 'span' : 'false'}
                    aria-label={`${formatCivilDate(cell.date, locale)}: ${describe(status, nameA, nameB, messages.calendar.bothFree, messages.calendar.bothWorking, messages.calendar.freeName)}.${todayText}${outsideText}${previewText}`}
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
          <span className="swatch" /> {messages.calendar.legendBoth}
        </li>
        <li data-status="free-a">
          <span className="swatch" /> {fill(messages.calendar.legendA, { name: nameA })}
        </li>
        <li data-status="free-b">
          <span className="swatch" /> {fill(messages.calendar.legendB, { name: nameB })}
        </li>
        <li data-status="working">
          <span className="swatch" /> {messages.calendar.legendWork}
        </li>
        {preview ? (
          <li data-status="preview">
            <span className="swatch" /> {messages.calendar.legendOff}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
