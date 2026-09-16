import type { Promo } from '@/lib/promotions';

/** Budget alert threshold — BR-6: alert at >=90%, never block. */
export const ALERT_RATIO = 0.9;

export type DashboardPeriod = '7d' | '30d' | 'month';

export interface DashboardPoint {
 day: string;
 spend: number;
 utilisation: number;
 active: number;
 alerts: number;
}

export interface TypeSpend {
 type: string;
 amount: number;
}

const PERIOD_DAYS: Record<DashboardPeriod, number> = { '7d': 7, '30d': 30, month: 30 };
const DAYS_REPORTED = 15;

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

export function deriveTypeSpend(promos: Promo[]): TypeSpend[] {
 return Array.from(
 promos.reduce((byType, promo) => {
 const amount = promo.spend ?? 0;
 byType.set(promo.type, (byType.get(promo.type) ?? 0) + amount);
 return byType;
 }, new Map<string, number>()),
 ).map(([type, amount]) => ({ type, amount })).sort((a, b) => b.amount - a.amount);
}

export function periodLabel(period: DashboardPeriod): string {
 return period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : 'This month';
}
