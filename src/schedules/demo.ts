import { cyclePattern } from './presets';
import type { PersonConfig } from './types';

/** First-launch schedules: a 2/2 rotation beside a Monday–Friday week. */
export function createDemoPeople(
  today: string,
  names: { personA: string; personB: string } = { personA: 'Person A', personB: 'Person B' },
): { personA: PersonConfig; personB: PersonConfig } {
  return {
    personA: {
      name: names.personA,
      schedule: {
        type: 'cycle',
        pattern: cyclePattern(2, 2),
        anchor: today,
      },
    },
    personB: {
      name: names.personB,
      schedule: {
        type: 'weekdays',
        workdays: [1, 2, 3, 4, 5],
      },
    },
  };
}
