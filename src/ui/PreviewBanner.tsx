import { previewComparison } from '../i18n/format';
import { useI18n } from '../i18n/LocaleProvider';
import type { BridgeRecommendation } from '../schedules/bridge';

interface PreviewBannerProps {
  recommendation: BridgeRecommendation;
  name: string;
  today: string;
  onExit: () => void;
}

export function PreviewBanner({ recommendation, name, today, onExit }: PreviewBannerProps) {
  const { locale, messages } = useI18n();
  const comparison = previewComparison(recommendation, name, today, locale);

  return (
    <section className="preview-banner" aria-labelledby="preview-heading">
      <div className="preview-copy">
        <p className="kicker" id="preview-heading">
          {messages.preview.title}
        </p>
        <p className="preview-who">{comparison.who}</p>
        <p className="preview-note">{messages.preview.notApplied}</p>
        <dl className="preview-compare">
          <div>
            <dt>{messages.preview.before}</dt>
            <dd>{comparison.before}</dd>
          </div>
          <div>
            <dt>{messages.preview.after}</dt>
            <dd>{comparison.after}</dd>
          </div>
          <div>
            <dt>{messages.preview.gained}</dt>
            <dd className="bridge-gain">+{comparison.gained}</dd>
          </div>
        </dl>
      </div>
      <button type="button" className="preview-exit" onClick={onExit}>
        {messages.preview.exit}
      </button>
    </section>
  );
}
