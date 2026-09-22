import { useEffect, useState } from 'react';
import { MONTH_NAMES, daysInMonth, formatIsoDate, parseIsoDate, shiftMonth } from '../calendar';
import { createDemoPeople } from '../schedules/demo';
import { loadAppState, saveAppState } from '../schedules/state';
import { summarizeSharedMonth } from '../schedules/summary';
import type { AppState, PersonConfig } from '../schedules/types';
import { IntervalList } from './IntervalList';
import { MonthCalendar } from './MonthCalendar';
import { ScheduleEditor } from './ScheduleEditor';
import { SharedSummary } from './SharedSummary';
import { localCivilToday } from './today';

const MIN_VIEW_YEAR = 1900;
const MAX_VIEW_YEAR = 2200;

function viewMonth(year: number, month: number, today: string): { year: number; month: number } {
  if (year >= MIN_VIEW_YEAR && year <= MAX_VIEW_YEAR && month >= 1 && month <= 12) {
    return { year, month };
  }
  const parts = parseIsoDate(today);
  if (parts.year >= MIN_VIEW_YEAR && parts.year <= MAX_VIEW_YEAR) {
    return { year: parts.year, month: parts.month };
  }
  return { year: 2000, month: 1 };
}

function createInitialState(today: string): AppState {
  const saved = loadAppState();
  if (saved) {
    const month = viewMonth(saved.year, saved.month, today);
    return { ...saved, ...month };
  }
  const month = viewMonth(0, 0, today);
  return { ...createDemoPeople(today), ...month };
}

function monthValue(year: number, month: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

export function App() {
  const [today] = useState(localCivilToday);
  const [state, setState] = useState<AppState>(() => createInitialState(today));

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const monthStart = formatIsoDate({ year: state.year, month: state.month, day: 1 });
  const monthEnd = formatIsoDate({
    year: state.year,
    month: state.month,
    day: daysInMonth(state.year, state.month),
  });
  const summary = summarizeSharedMonth(
    state.personA.schedule,
    state.personB.schedule,
    monthStart,
    monthEnd,
    today,
  );
  const monthLabel = `${MONTH_NAMES[state.month - 1]} ${state.year}`;

  const moveMonth = (delta: number) => {
    const next = shiftMonth(state.year, state.month, delta);
    if (next.year < MIN_VIEW_YEAR || next.year > MAX_VIEW_YEAR) return;
    setState((current) => ({ ...current, year: next.year, month: next.month }));
  };

  const resetDemo = () => {
    const currentToday = localCivilToday();
    const month = viewMonth(0, 0, currentToday);
    setState({ ...createDemoPeople(currentToday), ...month });
  };

  const setPerson = (key: 'personA' | 'personB', person: PersonConfig) => {
    setState((current) => ({ ...current, [key]: person }));
  };

  return (
    <div className="page">
      <header className="top">
        <div>
          <p className="eyebrow">ShiftTogether</p>
          <h1>Days you are both free</h1>
          <p className="lede">Compare two schedules on this device. Shared free days for the selected month are counted at the top.</p>
        </div>
        <button type="button" className="reset" onClick={resetDemo}>
          Reset example
        </button>
      </header>

      <SharedSummary summary={summary} monthLabel={monthLabel}>
        <div className="month-controls">
          <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}>
            Previous
          </button>
          <label className="sr-only" htmlFor="month-input">
            Choose month
          </label>
          <input
            id="month-input"
            type="month"
            value={monthValue(state.year, state.month)}
            min={`${MIN_VIEW_YEAR}-01`}
            max={`${MAX_VIEW_YEAR}-12`}
            onChange={(event) => {
              const match = /^(\d{4})-(\d{2})$/.exec(event.target.value);
              if (!match) return;
              const year = Number(match[1]);
              const month = Number(match[2]);
              if (year < MIN_VIEW_YEAR || year > MAX_VIEW_YEAR || month < 1 || month > 12) return;
              setState((current) => ({ ...current, year, month }));
            }}
          />
          <button type="button" aria-label="Next month" onClick={() => moveMonth(1)}>
            Next
          </button>
        </div>
      </SharedSummary>

      <div className="people">
        <ScheduleEditor
          headingId="person-a-heading"
          fallbackName="Person A"
          person={state.personA}
          today={today}
          onChange={(person) => setPerson('personA', person)}
        />
        <ScheduleEditor
          headingId="person-b-heading"
          fallbackName="Person B"
          person={state.personB}
          today={today}
          onChange={(person) => setPerson('personB', person)}
        />
      </div>

      <section className="card calendar-card" aria-label={`${monthLabel} calendar`}>
        <MonthCalendar
          year={state.year}
          month={state.month}
          personA={state.personA}
          personB={state.personB}
          today={today}
        />
      </section>

      <IntervalList
        intervals={summary.intervals}
        monthStart={monthStart}
        monthEnd={monthEnd}
        monthRelation={summary.monthRelation}
        today={today}
      />

      <footer>
        <p>Calculations stay in this browser. ShiftTogether is free software.</p>
      </footer>
    </div>
  );
}
