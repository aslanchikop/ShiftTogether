import { formatIsoDate } from '../calendar';

/**
 * The viewer's local calendar day.
 * The clock is read only here. Schedule math uses the ISO string that comes back.
 */
export function localCivilToday(now: Date = new Date()): string {
  return formatIsoDate({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
}
