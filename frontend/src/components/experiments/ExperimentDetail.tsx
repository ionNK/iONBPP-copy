'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import T from '@/theme/tokens';
import { experimentSchedule, promotionName } from '@/lib/experiments/mockExperiments';
import type { Experiment } from '@/lib/experiments/mockExperiments';
import { ExperimentStatusBadge } from './ExperimentStatusBadge';
import { ExperimentResultsTable } from './ExperimentResultsTable';

export interface ExperimentDetailProps {
  experiment: Experiment;
  onClose: () => void;
}

/**
 * Detail drawer (house style: scrim + right-side panel) with Overview and
 * Results tabs. A Draft has no results and shows the empty state.
 */
export function ExperimentDetail({ experiment, onClose }: ExperimentDetailProps) {
  const [tab, setTab] = useState<'Overview' | 'Results'>('Overview');
  const overview: [string, string][] = [
    ['Hypothesis', experiment.hypothesis],
    ['Primary metric', experiment.primaryMetric],
    ['Arms', experiment.armPromoIds.map((promoId) => `${promotionName(promoId)} (${experiment.allocations[promoId]}%)`).join(' · ')],
    ['Holdout', `${experiment.holdoutPercent}%`],
    ['Schedule', experimentSchedule(experiment)],
    ['Status', experiment.status],
  ];

  return (
    <div role="dialog" aria-modal="true" aria-label={`${experiment.name} details`} data-testid="experiment-detail">
      <div className="promo-drawer__scrim" style={{ background: T.scrim }} onClick={onClose} />
      <aside className="promo-drawer__panel promo-experiments__panel" style={{ background: T.white, borderLeft: `1px solid ${T.border}` }}>
        <div className="promo-drawer__header" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <h2 className="promo-drawer__title" style={{ color: T.textPrimary }}>{experiment.name}</h2>
            <div className="promo-drawer__meta">
              <span className="promo-drawer__id" style={{ color: T.textSecondary }}>{experiment.id}</span>
              <ExperimentStatusBadge status={experiment.status} />
            </div>
          </div>
          <button type="button" className="promo-icon-btn" style={{ color: T.textSecondary, borderRadius: T.radiusSm }} aria-label="Close details" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="promo-drawer__tabs" role="tablist" style={{ borderBottom: `1px solid ${T.border}` }}>
          {(['Overview', 'Results'] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className={`promo-drawer__tab${tab === item ? ' promo-drawer__tab--active' : ''}`}
              style={tab === item ? { color: T.textPrimary, borderBottom: `2px solid ${T.navy}` } : { color: T.textSecondary, borderBottom: '2px solid transparent' }}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="promo-drawer__body">
          {tab === 'Overview' && (
            <div className="promo-experiments__overview">
              {overview.map(([label, value]) => (
                <div key={label}>
                  <div className="promo-drawer__label" style={{ color: T.textSecondary }}>{label}</div>
                  <div className="promo-drawer__value" style={{ color: T.textPrimary }}>{value}</div>
                </div>
              ))}
            </div>
          )}
          {tab === 'Results' && experiment.results && <ExperimentResultsTable results={experiment.results} />}
          {tab === 'Results' && !experiment.results && (
            <div className="promo-empty" data-testid="experiment-results-empty">
              <p className="promo-empty__title" style={{ color: T.textPrimary }}>No results yet</p>
              <p className="promo-empty__body" style={{ color: T.textSecondary }}>Results appear once the experiment is running.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default ExperimentDetail;
