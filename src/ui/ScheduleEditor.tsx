import { useRef } from 'react';
import { dayStatus, type DayKind, type Schedule } from '../calendar';
import { PRESET_OPTIONS, patternForPreset, presetIdForPattern, type PresetId } from '../schedules/presets';
import type { PersonConfig } from '../schedules/types';
import { CivilDateField } from './CivilDateField';
import { localCivilToday } from './today';

const WEEKDAY_TOGGLES: { day: number; label: string }[] = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 7, label: 'Sun' },
];

const MAX_PATTERN = 56;

interface ScheduleEditorProps {
  headingId: string;
  fallbackName: string;
  person: PersonConfig;
  today: string;
  onChange: (next: PersonConfig) => void;
}

function displayName(name: string, fallback: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function presetOf(schedule: Schedule): PresetId {
  if (schedule.type === 'weekdays') return 'weekdays';
  return presetIdForPattern(schedule.pattern);
}

export function ScheduleEditor({ headingId, fallbackName, person, today, onChange }: ScheduleEditorProps) {
  const schedule = person.schedule;
  const lastAnchor = useRef(schedule.type === 'cycle' ? schedule.anchor : today);
  if (schedule.type === 'cycle') lastAnchor.current = schedule.anchor;

  const preset = presetOf(schedule);
  const shownName = displayName(person.name, fallbackName);

  const updateSchedule = (next: Schedule) => onChange({ ...person, schedule: next });

  const selectPreset = (nextPreset: PresetId) => {
    const anchor = schedule.type === 'cycle' ? schedule.anchor : lastAnchor.current || localCivilToday();
    if (nextPreset === 'weekdays') {
      const workdays = schedule.type === 'weekdays' ? schedule.workdays : [1, 2, 3, 4, 5];
      updateSchedule({ type: 'weekdays', workdays: [...workdays] });
      return;
    }
    if (nextPreset === 'custom') {
      const pattern =
        schedule.type === 'cycle' ? [...schedule.pattern] : (['work', 'work', 'work', 'work', 'work', 'free', 'free'] as DayKind[]);
      updateSchedule({ type: 'cycle', anchor, pattern });
      return;
    }
    updateSchedule({ type: 'cycle', anchor, pattern: patternForPreset(nextPreset) });
  };

  return (
    <section className="person" aria-labelledby={headingId}>
      <h2 id={headingId}>{shownName}</h2>
      <div className="field-grid">
        <label className="field">
          <span>Name</span>
          <input
            value={person.name}
            maxLength={40}
            onChange={(event) => onChange({ ...person, name: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Schedule</span>
          <select value={preset} onChange={(event) => selectPreset(event.target.value as PresetId)}>
            {PRESET_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {schedule.type === 'cycle' ? (
        <>
          <div className="field">
            <span id={`${headingId}-anchor`}>Anchor date</span>
            <CivilDateField
              labelId={`${headingId}-anchor`}
              value={schedule.anchor}
              onChange={(anchor) => updateSchedule({ ...schedule, anchor })}
            />
          </div>
          <p className="hint">
            Day 1 of the cycle is this anchor. Dates before it keep stepping backward through the same pattern. On
            the anchor, {shownName} is {dayStatus(schedule, schedule.anchor)}.
          </p>
          <ul className="pattern">
            {schedule.pattern.map((kind, index) => (
              <li key={`${index}-${kind}`}>
                {preset === 'custom' ? (
                  <button
                    type="button"
                    className={`chip ${kind}`}
                    onClick={() => {
                      const pattern = schedule.pattern.map((item, itemIndex) => {
                        if (itemIndex !== index) return item;
                        return item === 'work' ? 'free' : 'work';
                      });
                      updateSchedule({ ...schedule, pattern });
                    }}
                  >
                    Day {index + 1}: {kind === 'work' ? 'Work' : 'Free'}
                  </button>
                ) : (
                  <span className={`chip ${kind}`}>
                    Day {index + 1}: {kind === 'work' ? 'Work' : 'Free'}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {preset === 'custom' ? (
            <div className="row-actions">
              <button
                type="button"
                onClick={() => {
                  if (schedule.pattern.length >= MAX_PATTERN) return;
                  updateSchedule({ ...schedule, pattern: [...schedule.pattern, 'free'] });
                }}
                disabled={schedule.pattern.length >= MAX_PATTERN}
              >
                Add day
              </button>
              <button
                type="button"
                onClick={() => {
                  if (schedule.pattern.length <= 1) return;
                  updateSchedule({ ...schedule, pattern: schedule.pattern.slice(0, -1) });
                }}
                disabled={schedule.pattern.length <= 1}
              >
                Remove last day
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p className="hint">Choose the days {shownName} works. Every other day is free. This schedule has no anchor.</p>
          <ul className="pattern weekdays">
            {WEEKDAY_TOGGLES.map((weekday) => {
              const pressed = schedule.workdays.includes(weekday.day);
              return (
                <li key={weekday.day}>
                  <button
                    type="button"
                    className={`chip day-toggle ${pressed ? 'work' : 'free'}`}
                    aria-pressed={pressed}
                    onClick={() => {
                      const workdays = pressed
                        ? schedule.workdays.filter((day) => day !== weekday.day)
                        : [...schedule.workdays, weekday.day].sort((a, b) => a - b);
                      updateSchedule({ type: 'weekdays', workdays });
                    }}
                  >
                    <span className="toggle-day">{weekday.label}</span>
                    <span className="toggle-kind">{pressed ? 'Work' : 'Free'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
