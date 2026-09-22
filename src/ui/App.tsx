import { useEffect, useMemo, useState } from 'react';
import { daysInMonth, formatIsoDate, parseIsoDate, shiftMonth } from '../calendar';
import { monthTitle, previewComparison } from '../i18n/format';
import { useI18n } from '../i18n/LocaleProvider';
import { LOCALE_NAMES, LOCALES } from '../i18n/types';
import { findBridgeRecommendations, type BridgeRecommendation } from '../schedules/bridge';
import { createDemoPeople } from '../schedules/demo';
import { previewAfterViewChange, reconcilePreview, sameRecommendation, type PreviewSession } from '../schedules/preview';
import { loadAppState, saveAppState } from '../schedules/state';
import { findNextSharedPeriod, summarizeSharedMonth } from '../schedules/summary';
import type { AppState, PersonConfig } from '../schedules/types';
import { BridgePanel } from './BridgePanel';
import { MonthCalendar } from './MonthCalendar';
import { PreviewBanner } from './PreviewBanner';
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

function createInitialState(today: string, names: { personA: string; personB: string }): AppState {
  const saved = loadAppState();
  if (saved) {
    const month = viewMonth(saved.year, saved.month, today);
    return { ...saved, ...month };
  }
  const month = viewMonth(0, 0, today);
  return { ...createDemoPeople(today, names), ...month };
}

function displayName(name: string, fallback: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function App() {
  const { locale, messages, setLocale } = useI18n();
  const [today] = useState(localCivilToday);
  const demoNames = { personA: messages.schedules.demoA, personB: messages.schedules.demoB };
  const [state, setState] = useState<AppState>(() => createInitialState(today, demoNames));
  const [view, setView] = useState<'find' | 'make'>('find');
  const [preview, setPreview] = useState<PreviewSession | null>(null);

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
  const bridges = useMemo(
    () => findBridgeRecommendations(state.personA.schedule, state.personB.schedule, today),
    [state.personA, state.personB, today],
  );
  const monthLabel = monthTitle(state.year, state.month, locale);
  const nameA = displayName(state.personA.name, messages.schedules.fallbackA);
  const nameB = displayName(state.personB.name, messages.schedules.fallbackB);

  const moveMonth = (delta: number) => {
    const shifted = shiftMonth(state.year, state.month, delta);
    if (shifted.year < MIN_VIEW_YEAR || shifted.year > MAX_VIEW_YEAR) return;
    setState((current) => ({ ...current, year: shifted.year, month: shifted.month }));
  };

  const showMonth = (year: number, month: number) => {
    const visible = viewMonth(year, month, today);
    setState((current) => ({ ...current, ...visible }));
  };

  useEffect(() => {
    setPreview((current) => {
      if (!current) return null;
      const next = reconcilePreview(current.recommendation, bridges);
      if (!next) return null;
      if (sameRecommendation(current.recommendation, next)) return current;
      return { ...current, recommendation: next };
    });
  }, [bridges]);

  const resetDemo = () => {
    const currentToday = localCivilToday();
    setPreview(null);
    setView('find');
    setState({
      ...createDemoPeople(currentToday, {
        personA: messages.schedules.demoA,
        personB: messages.schedules.demoB,
      }),
      ...viewMonth(0, 0, currentToday),
    });
  };

  const setPerson = (key: 'personA' | 'personB', person: PersonConfig) => {
    setState((current) => ({ ...current, [key]: person }));
  };

  const exitPreview = () => {
    if (preview) showMonth(preview.returnYear, preview.returnMonth);
    setPreview(null);
  };

  const startPreview = (recommendation: BridgeRecommendation) => {
    if (
      preview &&
      preview.recommendation.person === recommendation.person &&
      preview.recommendation.date === recommendation.date
    ) {
      exitPreview();
      return;
    }
    const parts = parseIsoDate(recommendation.date);
    setPreview({
      recommendation,
      returnYear: preview?.returnYear ?? state.year,
      returnMonth: preview?.returnMonth ?? state.month,
    });
    showMonth(parts.year, parts.month);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('shared-calendar')?.scrollIntoView({ behavior: motion ? 'auto' : 'smooth', block: 'start' });
  };

  const shownPreview = previewAfterViewChange(preview);
  const previewName = shownPreview
    ? shownPreview.recommendation.person === 'a'
      ? nameA
      : nameB
    : '';
  const previewCopy = shownPreview
    ? previewComparison(shownPreview.recommendation, previewName, today, locale)
    : null;

  return (
    <div className="page">
      <header className="top">
        <div>
          <p className="eyebrow">ShiftTogether</p>
          <h1>{messages.app.title}</h1>
        </div>
        <div className="top-actions">
          <div className="lang-switch" role="group" aria-label={messages.app.language}>
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                data-lang={code}
                aria-pressed={locale === code}
                onClick={() => setLocale(code)}
              >
                {LOCALE_NAMES[code]}
              </button>
            ))}
          </div>
          <button type="button" className="reset" onClick={resetDemo}>
            {messages.app.reset}
          </button>
        </div>
      </header>

      <div className="views" role="tablist" aria-label={messages.views.group}>
        <button type="button" role="tab" aria-selected={view === 'find'} onClick={() => setView('find')}>
          {messages.views.find}
        </button>
        <button type="button" role="tab" aria-selected={view === 'make'} onClick={() => setView('make')}>
          {messages.views.make}
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
              activeKey={shownPreview ? `${shownPreview.recommendation.person}:${shownPreview.recommendation.date}` : null}
              onPreview={startPreview}
            />
          )}
          <section className="calendar-panel" id="shared-calendar" aria-label={`${monthLabel} calendar`}>
            {shownPreview && previewCopy ? (
              <PreviewBanner
                recommendation={shownPreview.recommendation}
                name={previewName}
                today={today}
                onExit={exitPreview}
              />
            ) : null}
            <MonthCalendar
              year={state.year}
              month={state.month}
              personA={state.personA}
              personB={state.personB}
              today={today}
              preview={
                shownPreview && previewCopy
                  ? {
                      date: shownPreview.recommendation.date,
                      start: shownPreview.recommendation.resulting.start,
                      end: shownPreview.recommendation.resulting.end,
                      cell: messages.preview.cell,
                      cellLabel: previewCopy.cellLabel,
                      spanLabel: messages.preview.spanLabel,
                    }
                  : null
              }
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
              <h2 id="schedules-heading">{messages.schedules.heading}</h2>
              <p>{messages.schedules.intro}</p>
            </div>
            <ScheduleEditor
              headingId="person-a-heading"
              fallbackName={messages.schedules.fallbackA}
              person={state.personA}
              today={today}
              onChange={(person) => setPerson('personA', person)}
            />
            <ScheduleEditor
              headingId="person-b-heading"
              fallbackName={messages.schedules.fallbackB}
              person={state.personB}
              today={today}
              onChange={(person) => setPerson('personB', person)}
            />
          </section>
        </aside>
      </div>

      <footer>
        <p>{messages.app.footer}</p>
      </footer>
    </div>
  );
}
