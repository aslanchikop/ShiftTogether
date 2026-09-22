import { daysInMonth, formatIsoDate, MONTH_NAMES, parseIsoDate } from '../calendar';

interface CivilDateFieldProps {
  value: string;
  labelId: string;
  onChange: (iso: string) => void;
}

export function CivilDateField({ value, labelId, onChange }: CivilDateFieldProps) {
  const parts = parseIsoDate(value);

  const commit = (year: number, month: number, day: number) => {
    const clamped = Math.min(Math.max(day, 1), daysInMonth(year, month));
    onChange(formatIsoDate({ year, month, day: clamped }));
  };

  return (
    <div className="date-field" role="group" aria-labelledby={labelId}>
      <label>
        <span className="sr-only">Day</span>
        <select
          aria-label="Anchor day"
          value={parts.day}
          onChange={(event) => commit(parts.year, parts.month, Number(event.target.value))}
        >
          {Array.from({ length: daysInMonth(parts.year, parts.month) }, (_, index) => index + 1).map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Month</span>
        <select
          aria-label="Anchor month"
          value={parts.month}
          onChange={(event) => commit(parts.year, Number(event.target.value), parts.day)}
        >
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
          aria-label="Anchor year"
          type="number"
          min={1}
          max={9999}
          value={parts.year}
          onChange={(event) => {
            const year = Number(event.target.value);
            if (!Number.isInteger(year) || year < 1 || year > 9999) return;
            commit(year, parts.month, parts.day);
          }}
        />
      </label>
    </div>
  );
}
