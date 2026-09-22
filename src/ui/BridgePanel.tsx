import { formatLongDate } from '../calendar';
import type { BridgeExplanation, BridgeRecommendation } from '../schedules/bridge';
import { BRIDGE_SEARCH_DAYS } from '../schedules/bridge';
import { formatPeriodRange } from '../schedules/summary';

interface BridgePanelProps {
  recommendations: BridgeRecommendation[];
  nameA: string;
  nameB: string;
  today: string;
  onInspect: (date: string) => void;
}

function improvement(item: BridgeRecommendation): string {
  const gained = item.additionalSharedDays === 1 ? '1 additional shared day' : `${item.additionalSharedDays} additional shared days`;
  if (item.explanation === 'joined-two-periods') {
    return `Joins separate breaks into ${item.resulting.days} days together. ${gained}.`;
  }
  if (item.explanation === 'created-period') {
    return item.resulting.days === 1
      ? `Creates a shared day that does not exist now. ${gained}.`
      : `Creates ${item.resulting.days} days together. ${gained}.`;
  }
  const before = item.baselineLongestDays;
  const beforeLabel = before === 1 ? '1 day' : `${before} days`;
  return `Extends ${beforeLabel} together to ${item.resulting.days} days. ${gained}.`;
}

function effectLabel(effect: BridgeExplanation): string {
  if (effect === 'joined-two-periods') return 'Joins two breaks';
  if (effect === 'created-period') return 'New time together';
  return 'Longer break';
}

export function BridgePanel({ recommendations, nameA, nameB, today, onInspect }: BridgePanelProps) {
  return (
    <section className="bridge" aria-labelledby="bridge-heading">
      <div className="section-head">
        <h2 id="bridge-heading">One day off</h2>
        <p>
          Could one extra day off in the next {BRIDGE_SEARCH_DAYS} days make a longer stretch together? These ideas are
          not saved, and they are not approved leave.
        </p>
      </div>
      {recommendations.length === 0 ? (
        <p className="bridge-empty">
          No single day off in the next {BRIDGE_SEARCH_DAYS} days would give you more time together than you already
          have.
        </p>
      ) : (
        <ul className="bridge-list">
          {recommendations.map((item) => {
            const name = item.person === 'a' ? nameA : nameB;
            return (
              <li key={`${item.person}:${item.date}`}>
                <article className="bridge-card">
                  <p className="bridge-effect">{effectLabel(item.explanation)}</p>
                  <h3>
                    {name} takes {formatLongDate(item.date)} off
                  </h3>
                  <p className="bridge-result">
                    Together {formatPeriodRange(item.resulting.start, item.resulting.end, today)}
                  </p>
                  <p className="bridge-meta">
                    {item.resulting.days} {item.resulting.days === 1 ? 'day' : 'days'} together. {improvement(item)}
                  </p>
                  <button type="button" onClick={() => onInspect(item.date)}>
                    Show on calendar
                  </button>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
