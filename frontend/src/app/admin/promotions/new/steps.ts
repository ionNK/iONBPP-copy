/**
 * Wizard step catalogue for the New Promotion flow (/admin/promotions/new).
 *
 * Budget (BR-6) is gated on features.budgets and Content on features.content:
 * with a flag off the step is filtered out and STEP.<id> resolves to 0, so its
 * JSX / validation / review row are unreachable but retained. Every step
 * reference goes through STEP.<id>, never a literal, so the stepper renumbers
 * with no gap and Back/Continue (step ± 1 over the filtered list) skip hidden
 * steps automatically.
 *
 * Shared by the wizard page and the draft store: a saved draft records both
 * the 1-based visible index (`lastStep`) and the step id (`lastStepId`) so a
 * draft saved while Content was visible still resumes on the right step once
 * Content is hidden and the remaining steps renumber.
 */
import { features } from '@/config/features';

export type StepId = 'basics' | 'qualification' | 'award' | 'budget' | 'schedule' | 'content' | 'notifications' | 'review';

export const ALL_STEPS: { id: StepId; label: string }[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'qualification', label: 'Qualification' },
  { id: 'award', label: 'Award' },
  { id: 'budget', label: 'Budget' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'content', label: 'Content' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'review', label: 'Review' },
];

export const HIDDEN_STEPS: StepId[] = [
  ...(features.budgets ? [] : ['budget' as const]),
  ...(features.content ? [] : ['content' as const]),
];

/** Visible steps, in order. */
export const STEP_DEFS = ALL_STEPS.filter((s) => !HIDDEN_STEPS.includes(s.id));

/** Visible step labels, in order (stepper + "Step N of M" subtitle). */
export const STEPS = STEP_DEFS.map((s) => s.label);

/** 1-based step number per id; 0 when the step is hidden by a feature flag. */
export const STEP: Record<StepId, number> = ALL_STEPS.reduce((acc, s) => {
  acc[s.id] = STEP_DEFS.findIndex((d) => d.id === s.id) + 1;
  return acc;
}, {} as Record<StepId, number>);

export const isStepId = (value: unknown): value is StepId =>
  typeof value === 'string' && ALL_STEPS.some((s) => s.id === value);

/** Clamps any number-like value to a valid 1-based visible step index (1 when unusable). */
export function clampStep(value: unknown): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(n, 1), STEPS.length);
}

/** Step id for a visible 1-based index (clamped). */
export function stepIdAt(index: number): StepId {
  return STEP_DEFS[clampStep(index) - 1].id;
}

/**
 * Resolves a persisted position to the current visible index.
 *  1. A known, currently visible step id wins (renumbering-safe).
 *  2. A known but hidden id (e.g. `content` with the flag off) maps to the
 *     nearest visible step before it in catalogue order.
 *  3. Otherwise the numeric `lastStep` is clamped into range (1 when absent).
 */
export function resolveStepIndex(lastStepId: unknown, lastStep: unknown): number {
  if (isStepId(lastStepId)) {
    if (STEP[lastStepId] > 0) return STEP[lastStepId];
    const position = ALL_STEPS.findIndex((s) => s.id === lastStepId);
    for (let i = position - 1; i >= 0; i -= 1) {
      const candidate = STEP[ALL_STEPS[i].id];
      if (candidate > 0) return candidate;
    }
    return 1;
  }
  return clampStep(lastStep);
}
