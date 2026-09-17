import type { Promo } from '@/lib/promotions';
import { CHANNEL_LABELS, channelSummary } from '@/lib/promotions';

/** Budget alert threshold (BR-6): alert at >=90%, never block. */
export const ALERT_RATIO = 0.9;

export type DashboardPeriod = '7d' | '30d' | 'month';

/** Donut breakdown dimensions. `provider` is derived from type, see PROVIDER_BY_TYPE. */
export type SpendDimension = 'type' | 'provider' | 'market' | 'channel';

export interface DashboardPoint {
 day: string;
 spend: number;
 utilisation: number;
 active: number;
 alerts: number;
}

/** One donut slice / legend row: `name` is the category value in the selected dimension. */
export interface CategorySpend {
 name: string;
 amount: number;
}

/** Global dashboard filter: every surface narrows to promos whose dimension value matches. */
export interface DashboardFilter {
 dimension: SpendDimension;
 value: string;
}

const PERIOD_DAYS: Record<DashboardPeriod, number> = { '7d': 7, '30d': 30, month: 30 };
const DAYS_REPORTED = 15;

/**
 * Fixed "today" for schedule maths: the same 15 September the period series
 * reports through (DAYS_REPORTED). The year is pinned so results never drift.
 */
const REPORT_YEAR = 2026;
const REPORT_MONTH = 8; /* September, zero-indexed */
const REPORT_TODAY = Date.UTC(REPORT_YEAR, REPORT_MONTH, DAYS_REPORTED);
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Provider is NOT a field on Promo; it is DERIVED from the promotion type.
 * Aviator/crash → Spribe; sportsbook → Sportsbook; casino → Provider TBC;
 * wallet-level offers → Platform. Unknown types fall back to Provider TBC.
 */
const PROVIDER_FALLBACK = 'Provider TBC';
const PROVIDER_BY_TYPE: Record<string, string> = {
 /* Aviator / crash */
 'Freebet · Welcome': 'Spribe',
 'Welcome Offer': 'Spribe',
 Leaderboard: 'Spribe',
 Missions: 'Spribe',
 /* Sportsbook */
 'Cashback · Multibet': 'Sportsbook',
 'Cashback · Bet Insurance': 'Sportsbook',
 Cashback: 'Sportsbook',
 'Odds Boost': 'Sportsbook',
 'Freebet · Rain': 'Sportsbook',
 'Freebet · Event': 'Sportsbook',
 'Freebet Award': 'Sportsbook',
 /* Casino */
 'Free Spins': PROVIDER_FALLBACK,
 Jackpot: PROVIDER_FALLBACK,
 /* Wallet-level, not tied to a game provider */
 'Deposit Match': 'Platform',
 Referral: 'Platform',
 'Referral Reward': 'Platform',
};

export const providerOf = (promo: Promo): string => PROVIDER_BY_TYPE[promo.type] ?? PROVIDER_FALLBACK;

/** Category accessor shared by the donut, the global filter and the palette order. */
export function dimensionValue(promo: Promo, dimension: SpendDimension): string {
 if (dimension === 'provider') return providerOf(promo);
 if (dimension === 'market') return promo.market;
if (dimension === 'channel') return channelSummary(promo.channels);
return promo.type;
}

export function applyFilter(promos: Promo[], filter: DashboardFilter | null): Promo[] {
 if (!filter) return promos;
if (filter.dimension === 'channel') {
return promos.filter((promo) => promo.channels.some((channel) => CHANNEL_LABELS[channel] === filter.value));
}
return promos.filter((promo) => dimensionValue(promo, filter.dimension) === filter.value);
}

const sum = (promos: Promo[], key: 'spend' | 'budget') =>
 promos.reduce((total, promo) => total + (promo[key] ?? 0), 0);

/**
 * Produces deterministic daily dashboard series from the current promotion list.
 * The prototype reports through 15 September; 30d/month retain that MTD data.
 */
export function deriveDashboardSeries(promos: Promo[], period: DashboardPeriod): DashboardPoint[] {
 const days = Math.min(PERIOD_DAYS[period], DAYS_REPORTED);
 const totalSpend = sum(promos, 'spend');
 const totalBudget = sum(promos, 'budget');
 const activePromos = promos.filter((promo) => promo.status === 'active').length;
 const alerts = promos.filter((promo) => promo.budget && promo.spend && promo.spend / promo.budget >= 0.9).length;
 const start = DAYS_REPORTED - days;

 return Array.from({ length: days }, (_, offset) => {
 const dayIndex = start + offset + 1;
 const progress = dayIndex / DAYS_REPORTED;
 const activeToday = promos.filter((promo) => promo.status === 'active' && (dayIndex >= 10 || promo.spend)).length;
 const alertToday = promos.filter((promo) => promo.budget && promo.spend && promo.spend / promo.budget >= 0.9 && dayIndex >= 8).length;
 return {
 day: `${dayIndex} Sep`,
 spend: Math.round(totalSpend * progress),
 utilisation: totalBudget ? Math.round((totalSpend * progress / totalBudget) * 100) : 0,
 active: Math.min(activePromos, activeToday),
 alerts: Math.min(alerts, alertToday),
 };
 });
}

/** Spend grouped by the selected dimension, largest first. */
export function spendByDimension(promos: Promo[], dimension: SpendDimension): CategorySpend[] {
 /* Channel spend has no observed attribution in the prototype model: split a
 * promotion's spend equally across its enabled channels so the breakdown
 * totals still sum to overall spend without inventing channel traffic. */
 if (dimension === 'channel') {
 return Array.from(
 promos.reduce((byName, promo) => {
 if (promo.channels.length === 0) return byName;
 const share = (promo.spend ?? 0) / promo.channels.length;
 for (const channel of promo.channels) {
 const name = CHANNEL_LABELS[channel];
 byName.set(name, (byName.get(name) ?? 0) + share);
 }
 return byName;
 }, new Map<string, number>()),
 ).map(([name, amount]) => ({ name, amount: Math.round(amount) })).sort((a, b) => b.amount - a.amount);
 }
 return Array.from(
 promos.reduce((byName, promo) => {
 const name = dimensionValue(promo, dimension);
 byName.set(name, (byName.get(name) ?? 0) + (promo.spend ?? 0));
 return byName;
 }, new Map<string, number>()),
 ).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
}

/* Schedule strings: "DD Mon – DD Mon", "DD Mon – ongoing", "YYYY-MM-DD – …" or "Draft". */
function parseScheduleDate(token: string): number | null {
 const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(token);
 if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
 const dayMonth = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(token);
 if (!dayMonth) return null;
 const month = MONTHS.indexOf(dayMonth[2].toLowerCase());
 return month < 0 ? null : Date.UTC(REPORT_YEAR, month, Number(dayMonth[1]));
}

function scheduleBounds(schedule: string): { start: number | null; end: number | null } {
 const [startToken = '', endToken = ''] = schedule.split(/\s[–-]\s/);
 return { start: parseScheduleDate(startToken.trim()), end: parseScheduleDate(endToken.trim()) };
}

/* Inclusive window: today ≤ date ≤ today + days. */
const withinNextDays = (date: number | null, days: number) =>
 date !== null && date >= REPORT_TODAY && date <= REPORT_TODAY + days * DAY_MS;

/** Active promotions whose end date falls within the next `days`: ongoing has no end and is excluded. */
export function endingWithin(promos: Promo[], days = 7): Promo[] {
 return promos.filter((promo) => promo.status === 'active' && withinNextDays(scheduleBounds(promo.schedule).end, days));
}

/** Scheduled promotions whose start date falls within the next `days`. */
export function startingWithin(promos: Promo[], days = 7): Promo[] {
 return promos.filter((promo) => promo.status === 'scheduled' && withinNextDays(scheduleBounds(promo.schedule).start, days));
}

/** Active promotions at or above the alert threshold (BR-6). */
export function activeBudgetAlerts(promos: Promo[]): Promo[] {
 return promos.filter((promo) => promo.status === 'active' && promo.budget != null && promo.spend != null && promo.spend / promo.budget >= ALERT_RATIO);
}

export function periodLabel(period: DashboardPeriod): string {
 return period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : 'This month';
}
