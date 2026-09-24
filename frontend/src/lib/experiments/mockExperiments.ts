/**
 * Promotions Experiments — deterministic frontend-only fixtures.
 *
 * Results intentionally contain counts and rates only: no award values or
 * currencies. The `Experiment` shape is ready to be replaced by an API model.
 */

import { PROMO_SEED } from '@/lib/promotions';

export type ExperimentStatus = 'Running' | 'Completed' | 'Draft';
export type ExperimentConfidence = 'Directional' | 'Significant' | 'Not available';

export interface ExperimentArmResult {
  promoId: string;
  players: number;
  qualified: number;
  awarded: number;
  repeatRate7d: number;
  retention30d: number;
  liftVsHoldout: number;
  confidence: ExperimentConfidence;
}

export interface ExperimentResults {
  arms: ExperimentArmResult[];
  holdout: Omit<ExperimentArmResult, 'promoId' | 'liftVsHoldout' | 'confidence'>;
}

export interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  armPromoIds: string[];
  allocations: Record<string, number>;
  holdoutPercent: number;
  status: ExperimentStatus;
  start: string | null;
  end: string | null;
  primaryMetric: 'Repeat rate 7d';
  results?: ExperimentResults;
}

const result = (promoId: string, players: number, qualified: number, awarded: number, repeatRate7d: number, retention30d: number, liftVsHoldout: number, confidence: ExperimentConfidence): ExperimentArmResult => ({
  promoId, players, qualified, awarded, repeatRate7d, retention30d, liftVsHoldout, confidence,
});

/** Immutable default fixture list. A consumer that needs local creation holds its additions in component state. */
export const EXPERIMENT_SEED: readonly Experiment[] = [
  {
    id: 'EXP-001',
    name: 'Sportsbook Cashback reward variant',
    hypothesis: 'Cashback B increases uptake without reducing repeat rate after seven days.',
    armPromoIds: ['PR-002', 'PR-002-B'],
    allocations: { 'PR-002': 45, 'PR-002-B': 45 },
    holdoutPercent: 10,
    status: 'Running',
    start: '2026-09-01',
    end: '2026-10-31',
    primaryMetric: 'Repeat rate 7d',
    results: {
      arms: [
        result('PR-002', 12480, 6720, 6451, 31.4, 22.8, 4.1, 'Directional'),
        /* B has higher qualification/uptake but lower repeat rate than A. */
        result('PR-002-B', 12520, 7418, 7140, 28.6, 21.6, -5.5, 'Directional'),
      ],
      holdout: { players: 2780, qualified: 0, awarded: 0, repeatRate7d: 30.2, retention30d: 22.1 },
    },
  },
  {
    id: 'EXP-002',
    name: 'First deposit qualification window',
    hypothesis: 'The revised qualification window improves repeat rate for first-time depositors.',
    armPromoIds: ['PR-006'],
    allocations: { 'PR-006': 85 },
    holdoutPercent: 15,
    status: 'Completed',
    start: '2026-07-01',
    end: '2026-08-31',
    primaryMetric: 'Repeat rate 7d',
    results: {
      arms: [result('PR-006', 8600, 4770, 4512, 38.7, 29.6, 11.2, 'Significant')],
      holdout: { players: 1518, qualified: 0, awarded: 0, repeatRate7d: 34.8, retention30d: 26.9 },
    },
  },
  {
    id: 'EXP-003',
    name: 'Sportsbook event reward test',
    hypothesis: 'A targeted event reward increases repeat rate after seven days.',
    armPromoIds: ['PR-012'],
    allocations: { 'PR-012': 100 },
    holdoutPercent: 0,
    status: 'Draft',
    start: null,
    end: null,
    primaryMetric: 'Repeat rate 7d',
  },
] as const;

export const PROMOTION_BY_ID = new Map(PROMO_SEED.map((promotion) => [promotion.id, promotion]));

export function promotionName(promoId: string): string {
  return PROMOTION_BY_ID.get(promoId)?.name ?? promoId;
}

/** A running experiment makes every arm read-only in the promotions list and in the arm picker. */
export function runningExperimentForPromotion(promoId: string, experiments: readonly Experiment[] = EXPERIMENT_SEED): Experiment | undefined {
  return experiments.find((experiment) => experiment.status === 'Running' && experiment.armPromoIds.includes(promoId));
}

export function experimentSchedule(experiment: Experiment): string {
  if (!experiment.start) return 'Not scheduled';
  return `${experiment.start} → ${experiment.end ?? 'Ongoing'}`;
}

/* ------------------------------------------------------------------ */
/* Create flow: draft shape + validation (shared by the modal and spec). */
/* ------------------------------------------------------------------ */

export const HOLDOUT_MAX = 50;
export const HOLDOUT_DEFAULT = 10;

export interface ExperimentDraft {
  name: string;
  hypothesis: string;
  armPromoIds: string[];
  /** Raw input strings per arm so the field can be empty while typing. */
  allocations: Record<string, string>;
  holdoutEnabled: boolean;
  holdoutPercent: string;
  start: string;
  end: string;
}

export const EMPTY_EXPERIMENT_DRAFT: ExperimentDraft = {
  name: '', hypothesis: '', armPromoIds: [], allocations: {}, holdoutEnabled: false, holdoutPercent: String(HOLDOUT_DEFAULT), start: '', end: '',
};

export function draftHoldout(draft: ExperimentDraft): number {
  return draft.holdoutEnabled ? Number(draft.holdoutPercent) : 0;
}

/** Arm allocations plus holdout; must equal 100 to submit. */
export function draftTotal(draft: ExperimentDraft): number {
  const arms = draft.armPromoIds.reduce((sum, promoId) => sum + (Number(draft.allocations[promoId]) || 0), 0);
  return arms + (Number.isFinite(draftHoldout(draft)) ? draftHoldout(draft) : 0);
}

export function validateExperimentDraft(draft: ExperimentDraft, experiments: readonly Experiment[]): string[] {
  const errors: string[] = [];
  const holdout = draftHoldout(draft);
  if (!draft.name.trim()) errors.push('Name is required.');
  if (!draft.hypothesis.trim()) errors.push('Hypothesis is required.');
  if (draft.armPromoIds.length === 0) errors.push('Select at least one arm.');
  if (draft.holdoutEnabled && (Number.isNaN(holdout) || holdout < 0 || holdout > HOLDOUT_MAX)) errors.push(`Holdout must be between 0% and ${HOLDOUT_MAX}%.`);
  if (draft.armPromoIds.length > 0 && draftTotal(draft) !== 100) errors.push(`Allocations plus holdout must total 100% (currently ${draftTotal(draft)}%).`);
  if (!draft.start) errors.push('Start date is required.');
  if (draft.end && draft.start && draft.end < draft.start) errors.push('End date must be after the start date.');
  const conflict = draft.armPromoIds.map((promoId) => runningExperimentForPromotion(promoId, experiments)).find(Boolean);
  if (conflict) errors.push(`A promotion may be in only one Running experiment (${conflict.id}).`);
  return errors;
}

export function experimentFromDraft(draft: ExperimentDraft, experiments: readonly Experiment[]): Experiment {
  return {
    id: nextExperimentId(experiments),
    name: draft.name.trim(),
    hypothesis: draft.hypothesis.trim(),
    armPromoIds: [...draft.armPromoIds],
    allocations: Object.fromEntries(draft.armPromoIds.map((promoId) => [promoId, Number(draft.allocations[promoId])])),
    holdoutPercent: draftHoldout(draft),
    status: 'Draft',
    start: draft.start,
    end: draft.end || null,
    primaryMetric: 'Repeat rate 7d',
  };
}

export function nextExperimentId(experiments: readonly Experiment[]): string {
  const max = experiments.reduce((current, experiment) => Math.max(current, Number(experiment.id.replace('EXP-', '')) || 0), 0);
  return `EXP-${String(max + 1).padStart(3, '0')}`;
}
