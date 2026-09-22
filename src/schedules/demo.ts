import { cyclePattern } from './presets';
import type { PersonConfig } from './types';

/** First-launch schedules: a 2/2 rotation beside a Monday–Friday week. */
export function createDemoPeople(today: string): { personA: PersonConfig; personB: PersonConfig } {
  return {
    personA: {
      name: 'Person A',
      schedule: {
        type: 'cycle',
        pattern: cyclePattern(2, 2),
        anchor: today,
      },
    },
    personB: {
      name: 'Person B',
      schedule: {
        type: 'weekdays',
        workdays: [1, 2, 3, 4, 5],
      },
    },
  };
}
