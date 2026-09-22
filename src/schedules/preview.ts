import type { BridgeRecommendation } from './bridge';

/**
 * A preview is a selected recommendation plus the month to restore on exit.
 * It is not part of the saved schedule.
 */
export interface PreviewSession {
  recommendation: BridgeRecommendation;
  returnYear: number;
  returnMonth: number;
}

export function reconcilePreview(
  current: BridgeRecommendation | null,
  available: readonly BridgeRecommendation[],
): BridgeRecommendation | null {
  if (!current) return null;
  return available.find((item) => item.person === current.person && item.date === current.date) ?? null;
}

export function sameRecommendation(left: BridgeRecommendation, right: BridgeRecommendation): boolean {
  return (
    left.person === right.person &&
    left.date === right.date &&
    left.explanation === right.explanation &&
    left.additionalSharedDays === right.additionalSharedDays &&
    left.resulting.start === right.resulting.start &&
    left.resulting.end === right.resulting.end &&
    left.resulting.days === right.resulting.days &&
    left.baselineLongestDays === right.baselineLongestDays &&
    left.baselineIntervals.length === right.baselineIntervals.length
  );
}

/** Switching Find time and Make time does not drop or apply a preview. */
export function previewAfterViewChange(session: PreviewSession | null): PreviewSession | null {
  return session;
}
