/**
 * Promotion Health — PROTOTYPE mock data (frontend-only, no network).
 *
 * Every number is deterministic: per-promotion hourly base rates multiplied
 * by the hours in the selected range (1h < 24h < 7d). `all_active` sums the
 * active promotions' counts, takes an awarded-weighted average for rates,
 * and merges alert states (firing > pending > ok).
 *
 * Counts, rates and alerts only — no monetary values are modelled here.
 */

import { PROMO_SEED } from '@/lib/promotions';

export type PromotionHealthView = 'funnel' | 'failure_rate' | 'alerts' | 'infra';
export type PromotionHealthRange = '1h' | '24h' | '7d';
export type AlertState = 'ok' | 'pending' | 'firing';

export const ALL_ACTIVE = 'all_active';

export interface ActivePromotion {
  /** Promotion id as shown on the promotions list (e.g. "PR-006"). */
  slug: string;
  name: string;
  type: string;
}

/**
 * The only promotions the card may offer: every `active` row of the
 * promotions list seed, in list order. Derived (not duplicated) so the
 * picker always mirrors /admin/promotions.
 */
export const ACTIVE_PROMOTIONS: ActivePromotion[] = PROMO_SEED
  .filter((promo) => promo.status === 'active')
  .map((promo) => ({ slug: promo.id, name: promo.name, type: promo.type }));

export const ALERT_NAMES = [
  'PromoPipelineNoProgress',
  'PromoAwardFailureRateHigh',
  'PromoAwardsStalled',
  'PromoNotificationFailureRateHigh',
  'PromoNotificationSystemDown',
  'PromoQualificationFailureRateHigh',
  'PromoDBFailuresDetected',
  'PromoCacheFailuresDetected',
] as const;
export type AlertName = (typeof ALERT_NAMES)[number];

export const FAILURE_THRESHOLD = 5;

/**
 * Flip to true to force `getPromotionHealth` to throw (error-state preview).
 * The spec triggers the same path through `window.__PROMO_HEALTH_ERROR__`.
 */
export const simulateError = false;

declare global {
  interface Window {
    __PROMO_HEALTH_ERROR__?: boolean;
  }
}

export interface FunnelData {
  candidates: number;
  qualified: number;
  awarded: number;
  notified: number;
}
export interface FailureRateData {
  current: number;
  threshold: number;
  series: { t: string; v: number }[];
}
export interface AlertEntry {
  name: AlertName;
  state: AlertState;
}
export interface InfraComponent {
  component: string;
  failRate: number;
}
export interface InfraData {
  db: InfraComponent[];
  cache: InfraComponent[];
  queue: InfraComponent[];
}

interface PromotionHealthBase {
  service: string;
  range: PromotionHealthRange;
  env: 'dev';
  fetchedAt: string;
  alertsFiring: number;
}

export type PromotionHealthData = PromotionHealthBase &
  (
    | { view: 'funnel'; funnel: FunnelData }
    | { view: 'failure_rate'; failureRate: FailureRateData }
    | { view: 'alerts'; alerts: AlertEntry[] }
    | { view: 'infra'; infra: InfraData }
  );

export interface PromotionHealthQuery {
  service: string;
  view: PromotionHealthView;
  range: PromotionHealthRange;
}

/* ---------------------------------------------------------------------------
 * Fixture: hourly base rates per promotion, keyed by promotions-list id.
 * ------------------------------------------------------------------------- */
const HOURS: Record<PromotionHealthRange, number> = { '1h': 1, '24h': 24, '7d': 168 };
const SERIES_POINTS = 12;

interface PromoFixture {
  perHour: FunnelData;
  /** Notification failure rate, % of awarded. */
  failurePct: number;
  /** Deterministic wobble applied to the failure series. */
  wobble: number;
  phase: number;
  infra: InfraData;
  alerts: Partial<Record<AlertName, AlertState>>;
}

const infra = (db: [number, number], cache: [number, number], queue: [number, number]): InfraData => ({
  db: [
    { component: 'postgres-primary', failRate: db[0] },
    { component: 'postgres-replica', failRate: db[1] },
  ],
  cache: [
    { component: 'redis-eligibility', failRate: cache[0] },
    { component: 'redis-session', failRate: cache[1] },
  ],
  queue: [
    { component: 'kafka-awards', failRate: queue[0] },
    { component: 'kafka-notifications', failRate: queue[1] },
  ],
});

const FIXTURES: Record<string, PromoFixture> = {
  /* Aviator Welcome Offer */
  'PR-001': {
    perHour: { candidates: 420, qualified: 268, awarded: 251, notified: 244 },
    failurePct: 1.8,
    wobble: 0.6,
    phase: 0.4,
    infra: infra([0.2, 0.1], [0.05, 0.02], [0.3, 0.4]),
    alerts: {},
  },
  /* Money Back (Sportsbook Cashback) */
  'PR-002': {
    perHour: { candidates: 265, qualified: 143, awarded: 137, notified: 133 },
    failurePct: 2.6,
    wobble: 0.8,
    phase: 1.1,
    infra: infra([0.3, 0.1], [0.04, 0.03], [0.5, 0.6]),
    alerts: {},
  },
  /* First Deposit Boost — the one promotion with a firing alert. */
  'PR-006': {
    perHour: { candidates: 96, qualified: 52, awarded: 47, notified: 39 },
    failurePct: 7.4,
    wobble: 1.4,
    phase: 2.3,
    infra: infra([0.2, 0.1], [0.06, 0.02], [0.4, 2.8]),
    alerts: { PromoNotificationFailureRateHigh: 'firing' },
  },
  /* Midweek Free Spins */
  'PR-007': {
    perHour: { candidates: 180, qualified: 110, awarded: 104, notified: 102 },
    failurePct: 1.2,
    wobble: 0.5,
    phase: 3.0,
    infra: infra([0.2, 0.1], [0.03, 0.02], [0.3, 0.3]),
    alerts: {},
  },
  /* Cashout Insurance */
  'PR-011': {
    perHour: { candidates: 140, qualified: 76, awarded: 72, notified: 70 },
    failurePct: 2.1,
    wobble: 0.7,
    phase: 1.8,
    infra: infra([0.3, 0.2], [0.05, 0.03], [0.6, 0.5]),
    alerts: { PromoAwardsStalled: 'pending' },
  },
};

/* Any active seed row without a bespoke profile still renders (quiet, healthy). */
const DEFAULT_FIXTURE: PromoFixture = {
  perHour: { candidates: 120, qualified: 70, awarded: 66, notified: 64 },
  failurePct: 1.5,
  wobble: 0.5,
  phase: 0,
  infra: infra([0.2, 0.1], [0.04, 0.02], [0.3, 0.3]),
  alerts: {},
};

const fixtureFor = (slug: string): PromoFixture => FIXTURES[slug] ?? DEFAULT_FIXTURE;

const isActiveSlug = (slug: string) => ACTIVE_PROMOTIONS.some((p) => p.slug === slug);

/** Slugs that a service selection resolves to. Unknown slugs resolve to nothing. */
function resolveSlugs(service: string): string[] {
  if (service === ALL_ACTIVE) return ACTIVE_PROMOTIONS.map((p) => p.slug);
  return isActiveSlug(service) ? [service] : [];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Integer formatter shared by the component and the spec (locale-stable). */
export const formatCount = (n: number) => Math.round(n).toLocaleString('en-GB');

/* Aggregations ------------------------------------------------------------- */

function funnelFor(slugs: string[], range: PromotionHealthRange): FunnelData {
  const h = HOURS[range];
  return slugs.reduce<FunnelData>(
    (acc, slug) => {
      const f = fixtureFor(slug).perHour;
      return {
        candidates: acc.candidates + Math.round(f.candidates * h),
        qualified: acc.qualified + Math.round(f.qualified * h),
        awarded: acc.awarded + Math.round(f.awarded * h),
        notified: acc.notified + Math.round(f.notified * h),
      };
    },
    { candidates: 0, qualified: 0, awarded: 0, notified: 0 },
  );
}

/** Awarded-weighted failure rate for the selection. */
function failurePctFor(slugs: string[]): { pct: number; wobble: number; phase: number } {
  const weight = slugs.reduce((s, slug) => s + fixtureFor(slug).perHour.awarded, 0);
  if (weight === 0) return { pct: 0, wobble: 0, phase: 0 };
  const avg = (pick: (f: PromoFixture) => number) =>
    slugs.reduce((s, slug) => s + pick(fixtureFor(slug)) * fixtureFor(slug).perHour.awarded, 0) / weight;
  return { pct: avg((f) => f.failurePct), wobble: avg((f) => f.wobble), phase: avg((f) => f.phase) };
}

const SERIES_LABEL: Record<PromotionHealthRange, (i: number) => string> = {
  '1h': (i) => `-${(SERIES_POINTS - 1 - i) * 5}m`,
  '24h': (i) => `-${(SERIES_POINTS - 1 - i) * 2}h`,
  '7d': (i) => `-${round1(((SERIES_POINTS - 1 - i) * 14) / 24)}d`,
};


function failureRateFor(slugs: string[], range: PromotionHealthRange): FailureRateData {
  const { pct, wobble, phase } = failurePctFor(slugs);
  /* Longer ranges smooth the series a little (more samples per point). */
  const damp = range === '1h' ? 1 : range === '24h' ? 0.8 : 0.6;
  const series = Array.from({ length: SERIES_POINTS }, (_, i) => ({
    t: SERIES_LABEL[range](i),
    v: Math.max(0, round1(pct + Math.sin(i * 0.9 + phase) * wobble * damp)),
  }));
  /* The last sample is the current reading. */
  series[SERIES_POINTS - 1] = { ...series[SERIES_POINTS - 1], v: round1(pct) };
  return { current: round1(pct), threshold: FAILURE_THRESHOLD, series };
}

const STATE_RANK: Record<AlertState, number> = { ok: 0, pending: 1, firing: 2 };

function alertsFor(slugs: string[]): AlertEntry[] {
  return ALERT_NAMES.map((name) => {
    const state = slugs.reduce<AlertState>((worst, slug) => {
      const s = fixtureFor(slug).alerts[name] ?? 'ok';
      return STATE_RANK[s] > STATE_RANK[worst] ? s : worst;
    }, 'ok');
    return { name, state };
  });
}

function infraFor(slugs: string[]): InfraData {
  const out: InfraData = { db: [], cache: [], queue: [] };
  if (slugs.length === 0) return out;
  const groups: (keyof InfraData)[] = ['db', 'cache', 'queue'];
  for (const group of groups) {
    const template = fixtureFor(slugs[0]).infra[group];
    out[group] = template.map((item, idx) => ({
      component: item.component,
      /* Shared infrastructure: report the mean fail rate across the selection. */
      failRate: round2(slugs.reduce((s, slug) => s + fixtureFor(slug).infra[group][idx].failRate, 0) / slugs.length),
    }));
  }
  return out;
}

/* Public API --------------------------------------------------------------- */

/**
 * Synchronous mock of the observability endpoint. Throws when `simulateError`
 * is set or the spec has raised `window.__PROMO_HEALTH_ERROR__`.
 */
export function getPromotionHealth({ service, view, range }: PromotionHealthQuery): PromotionHealthData {
  const forced = typeof window !== 'undefined' && window.__PROMO_HEALTH_ERROR__ === true;
  if (simulateError || forced) {
    throw new Error('Promotion health metrics unavailable (simulated)');
  }

  const slugs = resolveSlugs(service);
  const alerts = alertsFor(slugs);
  const base: PromotionHealthBase = {
    service,
    range,
    env: 'dev',
    fetchedAt: new Date().toISOString(),
    alertsFiring: alerts.filter((a) => a.state === 'firing').length,
  };

  switch (view) {
    case 'funnel':
      return { ...base, view, funnel: funnelFor(slugs, range) };
    case 'failure_rate':
      return { ...base, view, failureRate: failureRateFor(slugs, range) };
    case 'alerts':
      return { ...base, view, alerts };
    case 'infra':
      return { ...base, view, infra: infraFor(slugs) };
  }
}

/** Firing count for a selection without picking a view (header badge). Never throws. */
export function getAlertsFiring(service: string): number {
  return alertsFor(resolveSlugs(service)).filter((a) => a.state === 'firing').length;
}

