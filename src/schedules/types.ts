import type { Schedule } from '../calendar';

export interface PersonConfig {
  name: string;
  schedule: Schedule;
}

export interface AppState {
  personA: PersonConfig;
  personB: PersonConfig;
  year: number;
  month: number;
}
