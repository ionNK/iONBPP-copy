/**
 * Feature flags for the admin prototype. Flags HIDE surfaces; they never
 * delete code. Every consumer gates with `features.<flag> ? … : …` or an
 * early return so flipping a value restores the surface in full.
 */
export const features = {
  /* BR-6 budget alerts are agreed scope; hidden for the current presentation. Set true to restore. */
  budgets: false,
  /* Wizard Content step (CMS: tile copy, banners, T&Cs) hidden for the demo. Fields, validation
   * and saved draft data are retained; set true to restore the step and its Review summary. */
  content: false,
  /* Promotions → Experiments (A/B arms + holdout, PROTOTYPE mock data). Demo flag: gates the
   * nav item, the /admin/promotions/experiments route and the "In experiment" tag on the list. */
  experiments: true,
} as const;
