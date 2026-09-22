import { bridgeCardCopy, bridgeEmpty, bridgeIntro } from '../i18n/format';
import { useI18n } from '../i18n/LocaleProvider';
import type { BridgeRecommendation } from '../schedules/bridge';

interface BridgePanelProps {
  recommendations: BridgeRecommendation[];
  nameA: string;
  nameB: string;
  today: string;
  onInspect: (date: string) => void;
}

export function BridgePanel({ recommendations, nameA, nameB, today, onInspect }: BridgePanelProps) {
  const { locale, messages } = useI18n();

  return (
    <section className="bridge" aria-labelledby="bridge-heading">
      <div className="section-head">
        <h2 id="bridge-heading">{messages.bridge.heading}</h2>
        <p>{bridgeIntro(locale)}</p>
      </div>
      {recommendations.length === 0 ? (
        <p className="bridge-empty">{bridgeEmpty(locale)}</p>
      ) : (
        <ul className="bridge-list">
          {recommendations.map((item) => {
            const name = item.person === 'a' ? nameA : nameB;
            const card = bridgeCardCopy(item, name, today, locale);
            return (
              <li key={`${item.person}:${item.date}`}>
                <article className={`bridge-card bridge-${card.kind}`}>
                  <p className="bridge-effect">{card.effect}</p>
                  <h3>{card.title}</h3>
                  <p className="bridge-result">{card.range}</p>
                  <p className="bridge-facts">
                    <span>{card.total}</span>
                    <span className="bridge-gain">{card.gained}</span>
                  </p>
                  <button type="button" aria-label={messages.bridge.inspectLabel} onClick={() => onInspect(item.date)}>
                    {messages.bridge.inspect}
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
