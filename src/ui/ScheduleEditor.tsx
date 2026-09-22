import { useRef } from 'react';
import { dayStatus, type DayKind, type Schedule } from '../calendar';
import { fill } from '../i18n/format';
import { useI18n } from '../i18n/LocaleProvider';
import { patternForPreset, presetIdForPattern, type PresetId } from '../schedules/presets';
import type { PersonConfig } from '../schedules/types';
import { CivilDateField } from './CivilDateField';
import { localCivilToday } from './today';

const WEEKDAY_INDEXES = [1, 2, 3, 4, 5, 6, 7];

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
  const { messages } = useI18n();
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
          <span>{messages.schedules.name}</span>
          <input
            value={person.name}
            maxLength={40}
            onChange={(event) => onChange({ ...person, name: event.target.value })}
          />
        </label>
        <label className="field">
          <span>{messages.schedules.schedule}</span>
          <select value={preset} onChange={(event) => selectPreset(event.target.value as PresetId)}>
            {(Object.keys(messages.schedules.presets) as PresetId[]).map((id) => (
              <option key={id} value={id}>
                {messages.schedules.presets[id]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {schedule.type === 'cycle' ? (
        <>
          <div className="field">
            <span id={`${headingId}-anchor`}>{messages.schedules.anchor}</span>
            <CivilDateField
              labelId={`${headingId}-anchor`}
              value={schedule.anchor}
              onChange={(anchor) => updateSchedule({ ...schedule, anchor })}
            />
          </div>
          <p className="hint">
            {fill(messages.schedules.anchorHint, {
              name: shownName,
              status: dayStatus(schedule, schedule.anchor) === 'work' ? messages.schedules.work : messages.schedules.free,
            })}
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
                    {fill(messages.schedules.day, {
                      n: index + 1,
                      status: kind === 'work' ? messages.schedules.work : messages.schedules.free,
                    })}
                  </button>
                ) : (
                  <span className={`chip ${kind}`}>
                    {fill(messages.schedules.day, {
                      n: index + 1,
                      status: kind === 'work' ? messages.schedules.work : messages.schedules.free,
                    })}
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
                {messages.schedules.add}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (schedule.pattern.length <= 1) return;
                  updateSchedule({ ...schedule, pattern: schedule.pattern.slice(0, -1) });
                }}
                disabled={schedule.pattern.length <= 1}
              >
                {messages.schedules.remove}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p className="hint">{fill(messages.schedules.weekdayHint, { name: shownName })}</p>
          <ul className="pattern weekdays">
            {WEEKDAY_INDEXES.map((day) => {
              const pressed = schedule.workdays.includes(day);
              return (
                <li key={day}>
                  <button
                    type="button"
                    className={`chip day-toggle ${pressed ? 'work' : 'free'}`}
                    aria-pressed={pressed}
                    onClick={() => {
                      const workdays = pressed
                        ? schedule.workdays.filter((item) => item !== day)
                        : [...schedule.workdays, day].sort((a, b) => a - b);
                      updateSchedule({ type: 'weekdays', workdays });
                    }}
                  >
                    <span className="toggle-day">{messages.weekdaysShort[day - 1]}</span>
                    <span className="toggle-kind">{pressed ? messages.calendar.work : messages.schedules.free}</span>
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
