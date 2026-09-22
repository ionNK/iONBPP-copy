'use client';

import { Activity } from 'lucide-react';
import T from '@/theme/tokens';
import { Badge } from '@/components/ui';
import { PromotionHealth } from '@/components/observability/PromotionHealth';
import { usePromotionHealthSelection } from '@/hooks/usePromotionHealthSelection';
import { ACTIVE_PROMOTIONS, ALL_ACTIVE, getAlertsFiring } from '@/lib/observability/mockPromotionHealth';
import type { PromotionHealthRange, PromotionHealthView } from '@/lib/observability/mockPromotionHealth';

const VIEWS: { value: PromotionHealthView; label: string }[] = [
  { value: 'funnel', label: 'Funnel' },
  { value: 'failure_rate', label: 'Failure rate' },
    { value: 'alerts', label: 'Alerts' },
  { value: 'infra', label: 'Infrastructure' },
];

const RANGES: PromotionHealthRange[] = ['1h', '24h', '7d'];

const isView = (v: string): v is PromotionHealthView => VIEWS.some((o) => o.value === v);

/**
 * Dashboard "Promotion health" card (PROTOTYPE, mock data). Header carries the
 * Promotion select (All active + every active promotions-list entry, with a firing badge),
 * the View select and the 1h/24h/7d range toggle; the body is the compact
 * PromotionHealth surface. Selection persists in localStorage.
 */
export function PromotionHealthCard() {
  const { selection, setService, setView, setRange } = usePromotionHealthSelection();
  /* Alert lookup never throws (no error path), so the badge stays accurate while the body shows the error notice. */
  const firing = getAlertsFiring(selection.service);

  return (
    <section className="dash-card promo-health-card" data-testid="promo-health-card" aria-labelledby="promo-health-title">
      <div className="promo-health-card__header">
        <div className="promo-health-card__title-row">
          <span className="promo-health-card__icon" aria-hidden="true">
            <Activity size={16} />
          </span>
          <div>
            <h2 id="promo-health-title" className="dash-card__title promo-health-card__title">Promotion health</h2>
            <p className="dash-card__caption promo-health-card__caption">Pipeline, alerts and infrastructure · dev</p>
          </div>
        </div>

        <div className="promo-health-card__controls">
          <label className="promo-health-card__field">
            <span className="promo-health-card__label">Promotion</span>
            <span className="promo-health-card__select-wrap">
              <select
                className="promo-health-card__select"
                data-testid="promo-health-service-select"
                value={selection.service}
                onChange={(e) => setService(e.target.value)}
              >
                <option value={ALL_ACTIVE}>All active</option>
                {ACTIVE_PROMOTIONS.map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name}</option>
                ))}
              </select>
              {firing > 0 && (
                <span className="promo-health-card__firing" data-testid="promo-health-firing-badge">
                  <Badge color={T.destructive}>{firing} firing</Badge>
                </span>
              )}
            </span>
          </label>

          <label className="promo-health-card__field">
            <span className="promo-health-card__label">View</span>
            <select
              className="promo-health-card__select"
              data-testid="promo-health-view-select"
              value={selection.view}
              onChange={(e) => { if (isView(e.target.value)) setView(e.target.value); }}
            >
              {VIEWS.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </label>

          <div className="promo-health-card__range" role="group" aria-label="Range">
            {RANGES.map((r) => {
              const active = r === selection.range;
              return (
                <button
                  key={r}
                  type="button"
                  className={`promo-health-card__range-btn${active ? ' promo-health-card__range-btn--active' : ''}`}
                  data-testid={`promo-health-range-${r}`}
                  aria-pressed={active}
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <PromotionHealth compact service={selection.service} view={selection.view} range={selection.range} />
    </section>
  );
}

export default PromotionHealthCard;
