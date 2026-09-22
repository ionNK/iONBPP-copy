'use client';

import { useMemo } from 'react';
import { ExternalLink, TriangleAlert } from 'lucide-react';
import { Line, LineChart, ReferenceLine, ResponsiveContainer } from 'recharts';
import T from '@/theme/tokens';
import { formatCount, getPromotionHealth } from '@/lib/observability/mockPromotionHealth';
import type {
  AlertEntry,
  FailureRateData,
  FunnelData,
  InfraData,
  PromotionHealthData,
  PromotionHealthRange,
  PromotionHealthView,
} from '@/lib/observability/mockPromotionHealth';

export interface PromotionHealthProps {
  /** Promotion id (promotions-list id, e.g. "PR-006") or 'all_active'. */
  service: string;
  view: PromotionHealthView;
  range: PromotionHealthRange;
  /** Card mode: fixed height, no "Open in Monitoring" link. */
  compact?: boolean;
}

const RANGE_LABEL: Record<PromotionHealthRange, string> = { '1h': 'Last hour', '24h': 'Last 24 hours', '7d': 'Last 7 days' };

/* Alert display names: strip the "Promo" prefix and split CamelCase. */
const alertLabel = (name: string) => name.replace(/^Promo/, '').replace(/([a-z])([A-Z])/g, '$1 $2');

/* Presentation is CSS-only (.promo-health block in app/design-system.css);
 * the single permitted inline style is the funnel bar width. */

function FunnelView({ funnel }: { funnel: FunnelData }) {
  const steps: { key: keyof FunnelData; label: string }[] = [
    { key: 'candidates', label: 'Candidates' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'awarded', label: 'Awarded' },
    { key: 'notified', label: 'Notified' },
  ];
  const max = Math.max(1, funnel.candidates);
  return (
    <ol className="promo-health__funnel" aria-label="Promotion funnel">
      {steps.map((step) => {
        const value = funnel[step.key];
        const pct = Math.max(2, Math.round((value / max) * 100));
        return (
          <li key={step.key} className="promo-health__funnel-row" data-testid={`promo-health-funnel-${step.key}`}>
            <span className="promo-health__funnel-label">{step.label}</span>
            <span className="promo-health__funnel-track">
              <span className="promo-health__funnel-fill" style={{ width: `${pct}%` }} aria-hidden="true" />
            </span>
            <span className="promo-health__funnel-value">{formatCount(value)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function FailureRateView({ failureRate }: { failureRate: FailureRateData }) {
  const breached = failureRate.current >= failureRate.threshold;
  return (
    <div className="promo-health__failure">
      <div className="promo-health__failure-head">
        <span className={`promo-health__metric${breached ? ' promo-health__metric--breach' : ''}`} data-testid="promo-health-failure-rate">
          {breached && <TriangleAlert size={16} aria-hidden="true" />}
          {failureRate.current.toFixed(1)}%
        </span>
        <span className="promo-health__caption">
          threshold {failureRate.threshold}% · {breached ? 'above threshold' : 'within threshold'}
        </span>
      </div>
      <div className="promo-health__chart" aria-label="Failure rate trend">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={failureRate.series} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <ReferenceLine y={failureRate.threshold} stroke={T.destructiveActive} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="v" stroke={breached ? T.destructive : T.navy} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AlertsView({ alerts }: { alerts: AlertEntry[] }) {
  return (
    <ul className="promo-health__alerts" aria-label="Alert rules">
      {alerts.map((a) => (
        <li
          key={a.name}
          className={`promo-health__alert promo-health__alert--${a.state}`}
          data-testid="promo-health-alert-chip"
          data-state={a.state}
          title={a.name}
        >
          <span className="promo-health__alert-dot" aria-hidden="true" />
          {alertLabel(a.name)}
        </li>
      ))}
    </ul>
  );
}

function InfraView({ infra }: { infra: InfraData }) {
  const groups: { key: keyof InfraData; label: string }[] = [
    { key: 'db', label: 'Database' },
    { key: 'cache', label: 'Cache' },
    { key: 'queue', label: 'Queue' },
  ];
  return (
    <div className="promo-health__infra">
      {groups.map((g) => (
        <section key={g.key} className="promo-health__infra-group" aria-label={g.label}>
          <h4 className="promo-health__infra-title">{g.label}</h4>
          <ul className="promo-health__infra-list">
            {infra[g.key].map((c) => (
              <li key={c.component} className="promo-health__infra-row">
                <span className="promo-health__infra-name">{c.component}</span>
                <span className={`promo-health__infra-rate${c.failRate >= 1 ? ' promo-health__infra-rate--warn' : ''}`}>
                  {c.failRate.toFixed(2)}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Body({ data }: { data: PromotionHealthData }) {
  switch (data.view) {
    case 'funnel':
      return <FunnelView funnel={data.funnel} />;
    case 'failure_rate':
      return <FailureRateView failureRate={data.failureRate} />;
    case 'alerts':
      return <AlertsView alerts={data.alerts} />;
    case 'infra':
      return <InfraView infra={data.infra} />;
  }
}

/**
 * Promotion Health body: renders one observability view (funnel counts,
 * failure rate, alert rules, infrastructure fail rates) for a promotion or
 * all active promotions over a range. Data comes synchronously from the mock
 * module; any thrown error collapses to the "Metrics unavailable" notice.
 */
export function PromotionHealth({ service, view, range, compact }: PromotionHealthProps) {
  const result = useMemo<{ data: PromotionHealthData } | { error: true }>(() => {
    try {
      return { data: getPromotionHealth({ service, view, range }) };
    } catch {
      return { error: true };
    }
  }, [service, view, range]);

  return (
    <div className={`promo-health${compact ? ' promo-health--compact' : ''}`} data-testid="promo-health-body" data-view={view}>
      {'error' in result ? (
        <div className="promo-health__error" role="status">
          <TriangleAlert size={16} aria-hidden="true" />
          <span>Metrics unavailable · dev</span>
        </div>
      ) : (
        <>
          <Body data={result.data} />
          <div className="promo-health__footer">
            <span className="promo-health__caption">
              {RANGE_LABEL[range]} · {result.data.env}
            </span>
            {!compact && (
              <a className="promo-health__link" href="#monitoring" aria-disabled="true" onClick={(e) => e.preventDefault()}>
                Open in Monitoring <ExternalLink size={12} aria-hidden="true" />
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PromotionHealth;

