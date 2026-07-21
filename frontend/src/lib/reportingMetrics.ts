// Shared reporting vocabulary — the single source of truth for every
// operational / finance / compliance / leadership view (RP-009).
//
// All report surfaces import their metric definitions and label strings from
// here so "awarded / used / expired / blocked / failed" mean exactly the same
// thing in CRM, Support, Finance and Compliance views.
//
// Backed by a demo dataset for now; swap `getPromotionReports` for a real API
// call when available and keep the `PromotionReport` shape stable.

export type PromotionState = 'active' | 'paused' | 'ended' | 'archived';

/** Canonical metric keys with a single agreed definition (RP-009). */
export type MetricKey =
  | 'audiencePreview'
  | 'eligible'
  | 'entered'
  | 'qualified'
  | 'awardedCount'
  | 'awardedValue'
  | 'pendingAwards'
  | 'usedCount'
  | 'usedValue'
  | 'expiredCount'
  | 'expiredValue'
  | 'blocked'
  | 'budgetUsed'
  | 'budgetRemaining'
  | 'outstandingExposure'
  | 'finalCost';

/** Human definition of every metric, shown as tooltips / glossary. */
export const METRIC_DEFINITIONS: Record<MetricKey, { label: string; definition: string; isValue: boolean }> = {
  audiencePreview: { label: 'Audience Preview', definition: 'Estimated customers included before exclusions and eligibility gates.', isValue: false },
  eligible: { label: 'Eligible', definition: 'Customers who pass configured audience and universal gates.', isValue: false },
  entered: { label: 'Entered', definition: 'Customers who started the promotion journey.', isValue: false },
  qualified: { label: 'Qualified', definition: 'Customers who completed required action(s).', isValue: false },
  awardedCount: { label: 'Awarded', definition: 'Rewards successfully issued (count).', isValue: false },
  awardedValue: { label: 'Awarded Value', definition: 'Rewards successfully issued (value).', isValue: true },
  pendingAwards: { label: 'Pending Awards', definition: 'Rewards processing or awaiting confirmation.', isValue: false },
  usedCount: { label: 'Used', definition: 'Rewards used by customers (count).', isValue: false },
  usedValue: { label: 'Used Value', definition: 'Rewards used by customers (value).', isValue: true },
  expiredCount: { label: 'Expired', definition: 'Rewards expired unused (count).', isValue: false },
  expiredValue: { label: 'Expired Value', definition: 'Rewards expired unused (value).', isValue: true },
  blocked: { label: 'Blocked', definition: 'Customers blocked by eligibility, restrictions, caps or budget.', isValue: false },
  budgetUsed: { label: 'Budget Used', definition: 'Promotional value used.', isValue: true },
  budgetRemaining: { label: 'Budget Remaining', definition: 'Promotional value remaining.', isValue: true },
  outstandingExposure: { label: 'Outstanding Exposure', definition: 'Value of rewards awarded but not used/expired/settled.', isValue: true },
  finalCost: { label: 'Final Cost', definition: 'Settled cost after use, expiry, winnings and caps.', isValue: true },
};

/** Grouped block-reason categories (RP-006) — no sensitive per-customer detail. */
export type BlockReasonCategory = 'Eligibility' | 'Restrictions' | 'Caps' | 'Budget';

export interface BlockReasonBreakdown {
  category: BlockReasonCategory;
  count: number;
}

/** Per reward-type finance breakdown (RP-003). */
export interface RewardTypeBreakdown {
  rewardType: string;
  awardedValue: number;
  outstandingValue: number;
  usedValue: number;
  expiredValue: number;
  finalCost: number;
}

export interface PromotionReport {
  id: string;
  name: string;
  market: string;
  state: PromotionState;
  currency: string;
  budgetCap: number;
  startedAt: string;
  endedAt?: string;
  metrics: Record<MetricKey, number>;
  blockReasons: BlockReasonBreakdown[];
  rewardTypes: RewardTypeBreakdown[];
  // Operations-health signals.
  awardFailureRate: number; // 0..1
  volumeAnomaly: boolean;
}

// ---- Demo dataset (aligned with LiveMonitoring PRM-2024-001/002/003) ----

const REPORTS: PromotionReport[] = [
  {
    id: 'PRM-2024-001',
    name: 'Ethiopia Acca Insurance',
    market: 'Ethiopia',
    state: 'active',
    currency: 'ETB',
    budgetCap: 100000,
    startedAt: '2026-06-05',
    metrics: {
      audiencePreview: 42000, eligible: 31200, entered: 18420, qualified: 9210,
      awardedCount: 7180, awardedValue: 42300, pendingAwards: 210,
      usedCount: 5120, usedValue: 29800, expiredCount: 1240, expiredValue: 7100,
      blocked: 340, budgetUsed: 42300, budgetRemaining: 57700,
      outstandingExposure: 5400, finalCost: 0,
    },
    blockReasons: [
      { category: 'Eligibility', count: 180 }, { category: 'Restrictions', count: 90 },
      { category: 'Caps', count: 50 }, { category: 'Budget', count: 20 },
    ],
    rewardTypes: [
      { rewardType: 'Free Bet', awardedValue: 30000, outstandingValue: 3800, usedValue: 21000, expiredValue: 5200, finalCost: 0 },
      { rewardType: 'Bonus Cash', awardedValue: 12300, outstandingValue: 1600, usedValue: 8800, expiredValue: 1900, finalCost: 0 },
    ],
    awardFailureRate: 0.008,
    volumeAnomaly: false,
  },
  {
    id: 'PRM-2024-002',
    name: 'Kenya Weekend Boost',
    market: 'Kenya',
    state: 'active',
    currency: 'KES',
    budgetCap: 50000,
    startedAt: '2026-06-01',
    metrics: {
      audiencePreview: 28000, eligible: 19500, entered: 9800, qualified: 5400,
      awardedCount: 4900, awardedValue: 31200, pendingAwards: 120,
      usedCount: 4100, usedValue: 26100, expiredCount: 520, expiredValue: 3300,
      blocked: 180, budgetUsed: 31200, budgetRemaining: 18800,
      outstandingExposure: 1800, finalCost: 0,
    },
    blockReasons: [
      { category: 'Eligibility', count: 90 }, { category: 'Restrictions', count: 40 },
      { category: 'Caps', count: 35 }, { category: 'Budget', count: 15 },
    ],
    rewardTypes: [
      { rewardType: 'Odds Boost', awardedValue: 20000, outstandingValue: 1200, usedValue: 17000, expiredValue: 1800, finalCost: 0 },
      { rewardType: 'Free Bet', awardedValue: 11200, outstandingValue: 600, usedValue: 9100, expiredValue: 1500, finalCost: 0 },
    ],
    awardFailureRate: 0.005,
    volumeAnomaly: true,
  },
  {
    id: 'PRM-2024-003',
    name: 'Ghana Welcome Offer',
    market: 'Ghana',
    state: 'ended',
    currency: 'GHS',
    budgetCap: 30000,
    startedAt: '2026-04-01',
    endedAt: '2026-05-15',
    metrics: {
      audiencePreview: 12000, eligible: 7800, entered: 3200, qualified: 1400,
      awardedCount: 1100, awardedValue: 8600, pendingAwards: 0,
      usedCount: 760, usedValue: 5900, expiredCount: 210, expiredValue: 1600,
      blocked: 90, budgetUsed: 8600, budgetRemaining: 21400,
      outstandingExposure: 0, finalCost: 7500,
    },
    blockReasons: [
      { category: 'Eligibility', count: 45 }, { category: 'Restrictions', count: 25 },
      { category: 'Caps', count: 12 }, { category: 'Budget', count: 8 },
    ],
    rewardTypes: [
      { rewardType: 'Deposit Match', awardedValue: 6000, outstandingValue: 0, usedValue: 4200, expiredValue: 1100, finalCost: 5300 },
      { rewardType: 'Free Bet', awardedValue: 2600, outstandingValue: 0, usedValue: 1700, expiredValue: 500, finalCost: 2200 },
    ],
    awardFailureRate: 0.002,
    volumeAnomaly: false,
  },
];

export function getPromotionReports(): PromotionReport[] {
  return REPORTS;
}

/** Budget utilisation as a 0..100 percentage. */
export function budgetPct(r: PromotionReport): number {
  return Math.round((r.metrics.budgetUsed / r.budgetCap) * 100);
}

/** RP-005 — budget-exhausted status flag (>= 95% used). */
export function isBudgetExhausted(r: PromotionReport): boolean {
  return budgetPct(r) >= 95;
}

export function formatCurrency(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString()}`;
}

/** RP-008 — download any array of flat rows as a CSV file. */
export function exportCsv(filename: string, rows: Record<string, string | number>[]): void {
  if (typeof window === 'undefined' || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
