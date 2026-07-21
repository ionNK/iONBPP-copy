// Analytics Data Layer (CRM) — portfolio-level aggregations over the synced base.
// Pure functions that derive KPIs, distributions, cohorts, and revenue/risk cuts
// from the Player[] snapshot. No side effects; safe for SSR.

import { Player, PlayerLifecycle, LIFECYCLE_META, getPlayers, predictedValue } from './players';

export interface Kpi {
  key: string;
  label: string;
  value: string;
  raw: number;
  delta: number; // % vs. prior period (mocked, deterministic)
  hint: string;
}

export interface DistRow {
  key: string;
  label: string;
  color: string;
  count: number;
  value: number; // secondary metric (e.g. LTV)
}

export interface TrendPoint {
  label: string;
  ggr: number;
  ngr: number;
  deposits: number;
}

// Deterministic pseudo-delta so the dashboard feels alive without random churn.
function seededDelta(seed: string, spread = 24): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return Math.round(((h % (spread * 2)) - spread) * 10) / 10;
}

const money = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/** Headline KPI cards. */
export function buildKpis(players: Player[] = getPlayers()): Kpi[] {
  const total = players.length;
  const totalLtv = players.reduce((s, p) => s + p.ltv, 0);
  const totalGgr = players.reduce((s, p) => s + p.ggr, 0);
  const totalNgr = players.reduce((s, p) => s + p.ngr, 0);
  const totalDeposits = players.reduce((s, p) => s + p.totalDeposits, 0);
  const avgArpu = total ? Math.round(players.reduce((s, p) => s + p.arpu, 0) / total) : 0;
  const bonusCost = players.reduce((s, p) => s + p.ggr * p.bonusCostRatio, 0);
  const marginPct = totalGgr ? Math.round((totalNgr / totalGgr) * 100) : 0;

  return [
    { key: 'ngr', label: 'Net Gaming Revenue', value: money(totalNgr), raw: totalNgr, delta: seededDelta('ngr'), hint: `${marginPct}% NGR margin` },
    { key: 'ggr', label: 'Gross Gaming Revenue', value: money(totalGgr), raw: totalGgr, delta: seededDelta('ggr'), hint: 'Before bonus cost' },
    { key: 'deposits', label: 'Total Deposits', value: money(totalDeposits), raw: totalDeposits, delta: seededDelta('dep'), hint: `${total} players` },
    { key: 'arpu', label: 'Avg ARPU', value: money(avgArpu), raw: avgArpu, delta: seededDelta('arpu'), hint: 'Per active player' },
    { key: 'bonus', label: 'Bonus Cost', value: money(Math.round(bonusCost)), raw: bonusCost, delta: seededDelta('bonus'), hint: `${totalGgr ? Math.round((bonusCost / totalGgr) * 100) : 0}% of GGR` },
    { key: 'ltv', label: 'Predicted LTV', value: money(players.reduce((s, p) => s + predictedValue(p), 0)), raw: totalLtv, delta: seededDelta('pltv'), hint: 'Next 12 months' },
  ];
}

/** Lifecycle distribution with LTV weighting. */
export function lifecycleDist(players: Player[] = getPlayers()): DistRow[] {
  return (Object.keys(LIFECYCLE_META) as PlayerLifecycle[]).map((key) => {
    const seg = players.filter((p) => p.lifecycle === key);
    return {
      key, label: LIFECYCLE_META[key].label, color: LIFECYCLE_META[key].color,
      count: seg.length, value: seg.reduce((s, p) => s + p.ltv, 0),
    };
  });
}

/** Revenue split by primary product. */
export function productDist(players: Player[] = getPlayers()): DistRow[] {
  const meta: Record<string, { label: string; color: string }> = {
    sportsbook: { label: 'Sportsbook', color: '#38bdf8' },
    casino: { label: 'Casino', color: '#a855f7' },
    mixed: { label: 'Mixed', color: '#F2D641' },
  };
  return Object.keys(meta).map((key) => {
    const seg = players.filter((p) => p.primaryProduct === key);
    return { key, label: meta[key].label, color: meta[key].color, count: seg.length, value: seg.reduce((s, p) => s + p.ngr, 0) };
  });
}

/** Top revenue markets (by NGR), capped. */
export function marketDist(players: Player[] = getPlayers(), limit = 6): DistRow[] {
  const palette = ['#699951', '#38bdf8', '#F2D641', '#a855f7', '#fb923c', '#f87171', '#84cc16'];
  const byCountry = new Map<string, Player[]>();
  players.forEach((p) => byCountry.set(p.country, [...(byCountry.get(p.country) || []), p]));
  return [...byCountry.entries()]
    .map(([country, seg], i) => ({
      key: country, label: country, color: palette[i % palette.length],
      count: seg.length, value: seg.reduce((s, p) => s + p.ngr, 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** Risk band distribution (churn-based) for the portfolio. */
export function riskDist(players: Player[] = getPlayers()): DistRow[] {
  const bands = [
    { key: 'high', label: 'High Risk', color: '#f87171', test: (p: Player) => p.churnScore >= 66 },
    { key: 'medium', label: 'Medium Risk', color: '#fb923c', test: (p: Player) => p.churnScore >= 33 && p.churnScore < 66 },
    { key: 'low', label: 'Low Risk', color: '#699951', test: (p: Player) => p.churnScore < 33 },
  ];
  return bands.map((b) => {
    const seg = players.filter(b.test);
    return { key: b.key, label: b.label, color: b.color, count: seg.length, value: seg.reduce((s, p) => s + p.ltv, 0) };
  });
}

/** 12-week revenue trend (deterministic synthetic series anchored on totals). */
export function revenueTrend(players: Player[] = getPlayers()): TrendPoint[] {
  const totalGgr = players.reduce((s, p) => s + p.ggr, 0);
  const totalNgr = players.reduce((s, p) => s + p.ngr, 0);
  const totalDep = players.reduce((s, p) => s + p.totalDeposits, 0);
  const weeks = 12;
  const wave = (i: number, amp: number, phase: number) => 1 + amp * Math.sin((i / weeks) * Math.PI * 2 + phase);
  return Array.from({ length: weeks }, (_, i) => ({
    label: `W${i + 1}`,
    ggr: Math.round((totalGgr / weeks) * wave(i, 0.28, 0.4) * (0.7 + i * 0.045)),
    ngr: Math.round((totalNgr / weeks) * wave(i, 0.24, 0.7) * (0.7 + i * 0.045)),
    deposits: Math.round((totalDep / weeks) * wave(i, 0.32, 0.1) * (0.7 + i * 0.045)),
  }));
}

/** Highest-value players leaderboard. */
export function topPlayers(players: Player[] = getPlayers(), limit = 5): Player[] {
  return [...players].sort((a, b) => b.ltv - a.ltv).slice(0, limit);
}

export interface FunnelStage { key: string; label: string; count: number; pct: number }

/** Acquisition → value funnel across lifecycle stages. */
export function lifecycleFunnel(players: Player[] = getPlayers()): FunnelStage[] {
  const total = players.length || 1;
  const stages: { key: string; label: string; test: (p: Player) => boolean }[] = [
    { key: 'registered', label: 'Registered', test: () => true },
    { key: 'activated', label: 'Activated', test: (p) => p.totalDeposits > 0 },
    { key: 'engaged', label: 'Engaged', test: (p) => ['active', 'vip', 'reactivated'].includes(p.lifecycle) },
    { key: 'retained', label: 'Retained (30d)', test: (p) => Date.now() - new Date(p.lastActiveAt).getTime() < 30 * 864e5 },
    { key: 'highvalue', label: 'High Value', test: (p) => p.ltv >= 100000 },
  ];
  return stages.map((s) => {
    const count = players.filter(s.test).length;
    return { key: s.key, label: s.label, count, pct: Math.round((count / total) * 100) };
  });
}
