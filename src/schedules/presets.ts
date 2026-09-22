import type { DayKind } from '../calendar';

export type PresetId = '2-2' | '3-3' | '4-4' | 'weekdays' | 'custom';

export const PRESET_OPTIONS: { id: PresetId; label: string }[] = [
  { id: '2-2', label: '2 days on / 2 days off' },
  { id: '3-3', label: '3 days on / 3 days off' },
  { id: '4-4', label: '4 days on / 4 days off' },
  { id: 'weekdays', label: 'Days of the week' },
  { id: 'custom', label: 'Custom cycle' },
];

export function cyclePattern(workDays: number, restDays: number): DayKind[] {
  if (!Number.isInteger(workDays) || !Number.isInteger(restDays) || workDays < 0 || restDays < 0) {
    throw new RangeError('Cycle lengths must be zero or positive integers');
  }
  if (workDays + restDays < 1) throw new RangeError('Cycle pattern is empty');
  return [
    ...Array.from({ length: workDays }, () => 'work' as const),
    ...Array.from({ length: restDays }, () => 'free' as const),
  ];
}

export function patternForPreset(preset: Exclude<PresetId, 'weekdays' | 'custom'>): DayKind[] {
  if (preset === '2-2') return cyclePattern(2, 2);
  if (preset === '3-3') return cyclePattern(3, 3);
  return cyclePattern(4, 4);
}

export function presetIdForPattern(pattern: readonly DayKind[]): PresetId {
  const key = pattern.join(',');
  if (key === cyclePattern(2, 2).join(',')) return '2-2';
  if (key === cyclePattern(3, 3).join(',')) return '3-3';
  if (key === cyclePattern(4, 4).join(',')) return '4-4';
  return 'custom';
}
