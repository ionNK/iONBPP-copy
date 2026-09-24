'use client';

import { useMemo, useState } from 'react';
import T from '@/theme/tokens';
import { Checkbox, GhostButton, PrimaryButton, Toggle } from '@/components/ui';
import { PROMO_SEED } from '@/lib/promotions';
import {
  EMPTY_EXPERIMENT_DRAFT, HOLDOUT_MAX, draftTotal, experimentFromDraft, runningExperimentForPromotion, validateExperimentDraft,
} from '@/lib/experiments/mockExperiments';
import type { Experiment, ExperimentDraft } from '@/lib/experiments/mockExperiments';

export interface ExperimentCreateModalProps {
  experiments: readonly Experiment[];
  onCreate: (experiment: Experiment) => void;
  onClose: () => void;
}

/**
 * Create modal. Arms are Active promotions only; once the first arm is chosen
 * the picker narrows to the same type + vertical. Promotions already in a
 * Running experiment stay visible but disabled. Allocations + holdout must
 * total 100; holdout is optional and capped at HOLDOUT_MAX.
 */
export function ExperimentCreateModal({ experiments, onCreate, onClose }: ExperimentCreateModalProps) {
  const [draft, setDraft] = useState<ExperimentDraft>(EMPTY_EXPERIMENT_DRAFT);
  const [submitted, setSubmitted] = useState(false);
  const inputStyle = { border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, color: T.textPrimary, background: T.white };

  const activePromotions = useMemo(() => PROMO_SEED.filter((promotion) => promotion.status === 'active'), []);
  const firstArm = activePromotions.find((promotion) => promotion.id === draft.armPromoIds[0]);
  const options = activePromotions
    .filter((promotion) => !firstArm || (promotion.type === firstArm.type && promotion.vertical === firstArm.vertical))
    .map((promotion) => ({ promotion, running: runningExperimentForPromotion(promotion.id, experiments) }));

  const errors = validateExperimentDraft(draft, experiments);
  const total = draftTotal(draft);

  const toggleArm = (promoId: string, on: boolean) => {
    setDraft((current) => {
      const armPromoIds = on ? [...current.armPromoIds, promoId] : current.armPromoIds.filter((id) => id !== promoId);
      const allocations = { ...current.allocations };
      if (on) allocations[promoId] = '';
      else delete allocations[promoId];
      return { ...current, armPromoIds, allocations };
    });
  };

  const submit = () => {
    setSubmitted(true);
    if (errors.length > 0) return;
    onCreate(experimentFromDraft(draft, experiments));
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="experiment-create-title" data-testid="experiment-create">
      <div className="promo-modal__scrim" style={{ background: T.scrim }} onClick={onClose} />
      <div className="promo-modal__card promo-experiments__modal" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}>
        <h2 id="experiment-create-title" className="promo-modal__title" style={{ color: T.textPrimary }}>New experiment</h2>
        <div className="promo-experiments__form">
          <label className="promo-experiments__field">
            <span style={{ color: T.textPrimary }}>Name</span>
            <input className="promo-experiments__input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} style={inputStyle} />
          </label>
          <label className="promo-experiments__field">
            <span style={{ color: T.textPrimary }}>Hypothesis</span>
            <textarea className="promo-experiments__input" rows={2} value={draft.hypothesis} onChange={(event) => setDraft({ ...draft, hypothesis: event.target.value })} style={inputStyle} />
          </label>

          <div className="promo-experiments__field" role="group" aria-label="Arms">
            <span style={{ color: T.textPrimary }}>Arms</span>
            <p className="promo-experiments__hint" style={{ color: T.textSecondary }}>
              Active promotions only. After the first arm is chosen, only promotions with the same type and vertical are offered.
            </p>
            <div className="promo-experiments__arms" data-testid="experiment-arm-picker" style={{ border: `1px solid ${T.border}` }}>
              {options.map(({ promotion, running }) => {
                const selected = draft.armPromoIds.includes(promotion.id);
                return (
                  <div key={promotion.id} className="promo-experiments__arm" data-testid="experiment-arm-option" data-promo-id={promotion.id}>
                    <Checkbox
                      checked={selected}
                      disabled={Boolean(running) && !selected}
                      onChange={(on) => toggleArm(promotion.id, on)}
                      label={`${promotion.name} · ${promotion.type}`}
                      description={running ? `In experiment ${running.id}` : promotion.vertical ?? 'Cross-product'}
                    />
                    {selected && (
                      <input
                        className="promo-experiments__input promo-experiments__percent"
                        type="number"
                        min={0}
                        max={100}
                        aria-label={`${promotion.name} allocation %`}
                        value={draft.allocations[promotion.id] ?? ''}
                        onChange={(event) => setDraft({ ...draft, allocations: { ...draft.allocations, [promotion.id]: event.target.value } })}
                        style={inputStyle}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="promo-experiments__holdout">
            <Toggle checked={draft.holdoutEnabled} ariaLabel="Holdout" onChange={(on) => setDraft({ ...draft, holdoutEnabled: on })} />
            <span style={{ color: T.textPrimary }}>Holdout</span>
            {draft.holdoutEnabled && (
              <input className="promo-experiments__input promo-experiments__percent" type="number" min={0} max={HOLDOUT_MAX} aria-label="Holdout %" value={draft.holdoutPercent} onChange={(event) => setDraft({ ...draft, holdoutPercent: event.target.value })} style={inputStyle} />
            )}
            <span className="promo-experiments__hint" style={{ color: total === 100 ? T.success : T.textSecondary }} data-testid="experiment-allocation-total">Total {total}%</span>
          </div>

          <div className="promo-experiments__dates">
            <label className="promo-experiments__field">
              <span style={{ color: T.textPrimary }}>Start</span>
              <input className="promo-experiments__input" type="date" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} style={inputStyle} />
            </label>
            <label className="promo-experiments__field">
              <span style={{ color: T.textPrimary }}>End</span>
              <input className="promo-experiments__input" type="date" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} style={inputStyle} />
            </label>
          </div>

          <div className="promo-experiments__field">
            <span style={{ color: T.textPrimary }}>Primary metric</span>
            <span className="promo-cell" style={{ color: T.textSecondary }}>Repeat rate 7d</span>
          </div>

          {submitted && errors.length > 0 && (
            <ul className="promo-experiments__errors" role="alert" style={{ color: T.destructive, background: T.offWhite }}>
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          )}
        </div>
        <div className="promo-modal__actions">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={submit}>Create draft</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default ExperimentCreateModal;
