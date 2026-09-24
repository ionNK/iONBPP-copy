'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import T from '@/theme/tokens';
import { PrimaryButton, ZambiaFlag } from '@/components/ui';
import { ExperimentCreateModal } from '@/components/experiments/ExperimentCreateModal';
import { ExperimentDetail } from '@/components/experiments/ExperimentDetail';
import { ExperimentStatusBadge } from '@/components/experiments/ExperimentStatusBadge';
import { EXPERIMENT_SEED, experimentSchedule, promotionName } from '@/lib/experiments/mockExperiments';
import type { Experiment } from '@/lib/experiments/mockExperiments';
import { features } from '@/config/features';
import '../promotions.css';

const HEADINGS = ['Reference', 'Name', 'Arms', 'Holdout', 'Status', 'Schedule'];

/**
 * Promotions → Experiments (PROTOTYPE, demo-flag gated). Lists mock
 * experiments, opens a detail drawer per row and creates Draft experiments
 * held in component state (no persistence).
 */
export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([...EXPERIMENT_SEED]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const selected = experiments.find((experiment) => experiment.id === selectedId) ?? null;

  if (!features.experiments) {
    return (
      <div className="promo-page promo-experiments" style={{ background: T.offWhite }}>
        <div className="promo-container">
          <div className="promo-empty" data-testid="experiments-disabled" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
            <p className="promo-empty__title" style={{ color: T.textPrimary }}>Experiments is not enabled</p>
            <p className="promo-empty__body" style={{ color: T.textSecondary }}>Turn on the experiments demo flag to preview this area.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="promo-page promo-experiments" style={{ background: T.offWhite }}>
      <div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div className="promo-title-row">
            <h1 className="promo-title" style={{ color: T.textPrimary }}>Experiments</h1>
            <ZambiaFlag />
          </div>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>Compare promotion arms against a holdout · counts and rates only</p>
        </div>
        <PrimaryButton onClick={() => setCreateOpen(true)}><Plus size={16} /> New experiment</PrimaryButton>
      </div>

      <div className="promo-container">
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, overflow: 'hidden' }}>
          <div className="promo-table-scroll">
            <table className="promo-table" data-testid="experiments-table">
              <thead>
                <tr>
                  {HEADINGS.map((heading) => (
                    <th key={heading} style={{ color: T.textSecondary, borderBottom: `1px solid ${T.border}` }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {experiments.map((experiment, index) => (
                  <tr
                    key={experiment.id}
                    className="promo-row"
                    data-testid="experiment-row"
                    style={index < experiments.length - 1 ? { borderBottom: `1px solid ${T.border}` } : undefined}
                    onClick={() => setSelectedId(experiment.id)}
                  >
                    <td className="promo-cell" style={{ color: T.textSecondary }}>{experiment.id}</td>
                    <td className="promo-name" style={{ color: T.textPrimary }}>{experiment.name}</td>
                    <td className="promo-cell" style={{ color: T.textPrimary }}>{experiment.armPromoIds.map(promotionName).join(' · ')}</td>
                    <td className="promo-cell" style={{ color: T.textPrimary }}>{experiment.holdoutPercent}%</td>
                    <td><ExperimentStatusBadge status={experiment.status} /></td>
                    <td className="promo-schedule" style={{ color: T.textPrimary }}>{experimentSchedule(experiment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && <ExperimentDetail experiment={selected} onClose={() => setSelectedId(null)} />}
      {createOpen && (
        <ExperimentCreateModal
          experiments={experiments}
          onClose={() => setCreateOpen(false)}
          onCreate={(experiment) => { setExperiments((current) => [experiment, ...current]); setCreateOpen(false); }}
        />
      )}
    </div>
  );
}
