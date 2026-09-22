import { useEffect, useState } from 'react';
import { MONTH_NAMES, daysInMonth, formatIsoDate, parseIsoDate, shiftMonth } from '../calendar';
import { findBridgeRecommendations } from '../schedules/bridge';
import { createDemoPeople } from '../schedules/demo';
import { loadAppState, saveAppState } from '../schedules/state';
import { findNextSharedPeriod, summarizeSharedMonth } from '../schedules/summary';
import type { AppState, PersonConfig } from '../schedules/types';
import { BridgePanel } from './BridgePanel';
import { MonthCalendar } from './MonthCalendar';
import { NextTogether } from './NextTogether';
import { PeriodList } from './PeriodList';
import { ScheduleEditor } from './ScheduleEditor';
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

function displayName(name: string, fallback: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function App() {
  const [today] = useState(localCivilToday);
  const [state, setState] = useState<AppState>(() => createInitialState(today));
  const [view, setView] = useState<'find' | 'make'>('find');
  const [markedDate, setMarkedDate] = useState<string | null>(null);

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
  const next = findNextSharedPeriod(state.personA.schedule, state.personB.schedule, today);
  const bridges = findBridgeRecommendations(state.personA.schedule, state.personB.schedule, today);
  const monthLabel = `${MONTH_NAMES[state.month - 1]} ${state.year}`;
  const nameA = displayName(state.personA.name, 'Person A');
  const nameB = displayName(state.personB.name, 'Person B');

  const moveMonth = (delta: number) => {
    const shifted = shiftMonth(state.year, state.month, delta);
    if (shifted.year < MIN_VIEW_YEAR || shifted.year > MAX_VIEW_YEAR) return;
    setState((current) => ({ ...current, year: shifted.year, month: shifted.month }));
  };

  const showMonth = (year: number, month: number) => {
    const visible = viewMonth(year, month, today);
    setState((current) => ({ ...current, ...visible }));
  };

  const resetDemo = () => {
    const currentToday = localCivilToday();
    setMarkedDate(null);
    setView('find');
    setState({ ...createDemoPeople(currentToday), ...viewMonth(0, 0, currentToday) });
  };

  const setPerson = (key: 'personA' | 'personB', person: PersonConfig) => {
    setMarkedDate(null);
    setState((current) => ({ ...current, [key]: person }));
  };

  const inspectBridge = (date: string) => {
    const parts = parseIsoDate(date);
    showMonth(parts.year, parts.month);
    setMarkedDate(date);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('shared-calendar')?.scrollIntoView({ behavior: motion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="page">
      <header className="top">
        <div>
          <p className="eyebrow">ShiftTogether</p>
          <h1>When are you both free?</h1>
        </div>
        <button type="button" className="reset" onClick={resetDemo}>
          Reset example
        </button>
      </header>

      <div className="views" role="tablist" aria-label="What to look at">
        <button type="button" role="tab" aria-selected={view === 'find'} onClick={() => setView('find')}>
          Find time
        </button>
        <button type="button" role="tab" aria-selected={view === 'make'} onClick={() => setView('make')}>
          Make time
        </button>
      </div>

      <div className="workspace">
        <div className="primary">
          {view === 'find' ? (
            <NextTogether
              next={next}
              summary={summary}
              monthLabel={monthLabel}
              monthStart={monthStart}
              monthEnd={monthEnd}
              today={today}
              onShowPeriod={showMonth}
            />
          ) : (
            <BridgePanel
              recommendations={bridges}
              nameA={nameA}
              nameB={nameB}
              today={today}
              onInspect={inspectBridge}
            />
          )}
          <section className="calendar-panel" id="shared-calendar" aria-label={`${monthLabel} calendar`}>
            {markedDate ? (
              <p className="suggest-note">The dashed day is a hypothetical day off. The saved schedules are unchanged.</p>
            ) : null}
            <MonthCalendar
              year={state.year}
              month={state.month}
              personA={state.personA}
              personB={state.personB}
              today={today}
              markedDate={markedDate}
              minYear={MIN_VIEW_YEAR}
              maxYear={MAX_VIEW_YEAR}
              onPrevious={() => moveMonth(-1)}
              onNext={() => moveMonth(1)}
              onSelectMonth={(month) => showMonth(state.year, month)}
              onSelectYear={(year) => showMonth(year, state.month)}
            />
          </section>
        </div>

        <aside className="secondary">
          {view === 'find' ? (
            <PeriodList
              intervals={summary.intervals}
              monthLabel={monthLabel}
              monthRelation={summary.monthRelation}
              today={today}
            />
          ) : null}
          <section className="schedules" aria-labelledby="schedules-heading">
            <div className="section-head">
              <h2 id="schedules-heading">Schedules</h2>
              <p>A shared day is one when both people are free.</p>
            </div>
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
          </section>
        </aside>
      </div>

      <footer>
        <p>Calculations stay in this browser. ShiftTogether is free software.</p>
      </footer>
    </div>
  );
}
