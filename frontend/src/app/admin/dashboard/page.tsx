'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CalendarClock, CalendarPlus, ChevronRight, CircleAlert, CircleCheck, ClipboardCheck, Clock3, Info, TriangleAlert, Zap } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import T, { dashboardPalette } from '@/theme/tokens';
import { Badge, GhostButton, ZambiaFlag } from '@/components/ui';
import { PROMO_SEED, loadPromotions } from '@/lib/promotions';
import type { Promo, PromoStatus } from '@/lib/promotions';
import { ALERT_RATIO, activeBudgetAlerts, applyFilter, deriveDashboardSeries, dimensionValue, endingWithin, periodLabel, spendByDimension, startingWithin } from '@/lib/dashboard';
import type { DashboardFilter, SpendDimension } from '@/lib/dashboard';
/* Shared page-skeleton structural classes (top bar, container, chips) */
import '../promotions/promotions.css';
import './dashboard.css';

/* Status pill colours: same mapping as the promotions list. */
const STATUS: Record<PromoStatus, { label: string; color: string; ghost?: boolean }> = {
  active: { label: 'Active', color: T.success },
  scheduled: { label: 'Scheduled', color: T.blue },
  expired: { label: 'Expired', color: T.darkGrey },
  draft: { label: 'Draft', color: T.draft },
  pending: { label: 'Pending approval', color: T.navy, ghost: true },
};

type Period = '7d' | '30d' | 'month';
const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'month', label: 'This month' },
];

const fmtK = (n: number) => `K ${Math.round(n).toLocaleString()}`;
/* Axis tick format: compact thousands ("K 120k"). */
const fmtAxisK = (n: number) => (n >= 1000 ? `K ${Math.round(n / 1000)}k` : `K ${Math.round(n)}`);
const fmtPct = (n: number) => `${Math.round(n)}%`;
const fmtCount = (n: number) => `${Math.round(n)}`;

/* Donut breakdown dimensions: the segmented control in the "Spend by …" card. */
const DIMENSIONS: { value: SpendDimension; label: string }[] = [
  { value: 'type', label: 'Type' },
  { value: 'provider', label: 'Provider' },
  { value: 'market', label: 'Market' },
];

/* Stable category-to-palette mapping: palette entries are Unity-backed tokens. */
const categoryColour = (name: string, order: string[]) => dashboardPalette[Math.max(0, order.indexOf(name)) % dashboardPalette.length];

/* Token hex → translucent tint. Only ever fed T.* values, so no colour literals live in this file. */
const tint = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

/* Activity feed (derived from the promotions list). */
type ActivityKind = 'alert' | 'scheduled' | 'expired' | 'activation';
interface ActivityItem { id: string; kind: ActivityKind; title: string; detail: string; minutesAgo: number }
const ACTIVITY_COLOUR: Record<ActivityKind, string> = {
  alert: T.destructiveActive,
  scheduled: T.blue,
  expired: T.darkGrey,
  activation: T.progressActive,
};
const ACTIVITY_ICON: Record<ActivityKind, typeof Info> = { alert: CircleAlert, scheduled: Clock3, expired: CircleCheck, activation: Zap };

function deriveActivity(promos: Promo[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  promos.forEach((p, i) => {
    const seed = (i + 1) * 37;
    const ratio = p.budget && p.spend ? p.spend / p.budget : 0;
    if (p.status === 'active' && ratio >= ALERT_RATIO) {
      items.push({ id: `${p.id}-alert`, kind: 'alert', title: `${p.name} reached ${Math.round(ratio * 100)}% of budget`, detail: `${p.id} · ${p.type}`, minutesAgo: 20 + (seed % 90) });
    }
    if (p.status === 'active') items.push({ id: `${p.id}-live`, kind: 'activation', title: `${p.name} went live`, detail: `${p.id} · ${p.type}`, minutesAgo: 180 + (seed % 600) });
    if (p.status === 'scheduled') items.push({ id: `${p.id}-sched`, kind: 'scheduled', title: `${p.name} scheduled`, detail: `${p.id} · ${p.schedule}`, minutesAgo: 60 + (seed % 400) });
    if (p.status === 'expired') items.push({ id: `${p.id}-exp`, kind: 'expired', title: `${p.name} expired`, detail: `${p.id} · ${p.schedule}`, minutesAgo: 1440 + (seed % 2000) });
  });
  return items.sort((a, b) => a.minutesAgo - b.minutesAgo).slice(0, 6);
}

const relativeTime = (m: number) => (m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`);

/* Reduced motion: read once per render on the client; SSR defaults to false. */
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Count-up hook: 300ms rAF tween from 0 to `target`; re-runs when target
 * changes. Under reduced motion the target is returned directly (no tween). */
function useCountUp(target: number, reduced: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 300);
      setValue(target * (1 - (1 - t) * (1 - t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);
  return reduced ? target : value;
}

/* ---------------------------------------------------------------------------
 * Custom tooltip. Recharts' TooltipProps generics fight the payload shape
 * Props are typed as `any` on purpose (pragmatic cast, see report).
 * ------------------------------------------------------------------------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip(props: any) {
  const { active, payload, label, formatter } = props;
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="dash-tooltip"
      style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, boxShadow: T.shadowRaise, color: T.textPrimary }}
    >
      <div className="dash-tooltip__title">{label}</div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="dash-tooltip__row">
          <span style={{ color: T.textSecondary }}>{entry.name}</span>
          <span>{formatter ? formatter(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* Shared axis tick style: Caption 12px, textSecondary. */
const TICK = { fontSize: 12, fill: T.textSecondary };

/* Legend entry: hand-rolled so the "Budget pace" swatch can be dashed. */
function LegendItem({ label, color, dashed }: { label: string; color: string; dashed?: boolean }) {
  return (
    <span className="dash-legend__item" style={{ color: T.textSecondary }}>
      <span className={`dash-legend__swatch${dashed ? ' dash-legend__swatch--dashed' : ''}`} style={{ color }} aria-hidden="true" />
      {label}
    </span>
  );
}

/* Filtered-empty notice: offWhite panel + Info icon + Footnote text. */
function FilteredEmpty({ value }: { value: string }) {
  return (
    <div className="dash-notice" style={{ background: T.offWhite, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, color: T.textSecondary }}>
      <Info size={16} aria-hidden="true" />
      <span>No {value} promotions in this period.</span>
    </div>
  );
}

/* "Needs attention" card: whole card is a link; 0 counts are de-emphasised, not hidden. */
interface AttentionCardProps {
  label: string;
  count: number;
  icon: typeof Info;
  accent: string;
  onOpen: () => void;
}
function AttentionCard({ label, count, icon: Icon, accent, onOpen }: AttentionCardProps) {
  const empty = count === 0;
  return (
    <div
      className="dash-attention__card dash-card--interactive dash-card--clickable"
      role="link"
      tabIndex={0}
      aria-label={`${label}: ${count}`}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd, ['--dash-shadow' as string]: T.shadowRaise }}
    >
      <span
        className="dash-attention__icon"
        style={{ background: empty ? T.offWhite : tint(accent, 0.1), color: empty ? T.textSecondary : accent, borderRadius: T.radiusPill }}
        aria-hidden="true"
      >
        <Icon size={16} />
      </span>
      <div className="dash-attention__copy">
        <div className="dash-attention__label" style={{ color: T.textSecondary }}>{label}</div>
        <div className="dash-attention__count" style={{ color: empty ? T.textSecondary : T.textPrimary }}>{count}</div>
      </div>
      <ChevronRight size={16} className="dash-attention__chevron" style={{ color: T.textSecondary }} aria-hidden="true" />
    </div>
  );
}

/* Delta pill: ▲/▼ with good/bad tint. `invert` flips the semantics (alerts up = bad). */
function DeltaPill({ pct, invert }: { pct: number; invert?: boolean }) {
  const up = pct >= 0;
  const good = invert ? !up : up;
  return (
    <span className="dash-delta" style={{ color: good ? T.success : T.destructive, background: good ? T.successBg : T.selectionBg, borderRadius: T.radiusPill }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  );
}

/* KPI card: count-up value, delta pill, 36px sparkline. */
interface KpiCardProps {
  label: string;
  value: number;
  format: (n: number) => string;
  deltaPct: number;
  invertDelta?: boolean;
  accent: string;
  series: { day: string; v: number }[];
  chartKey: string;
  reduced: boolean;
  onClick?: () => void;
}
function KpiCard({ label, value, format, deltaPct, invertDelta, accent, series, chartKey, reduced, onClick }: KpiCardProps) {
  const shown = useCountUp(value, reduced);
  return (
    <section
      className={`dash-card dash-kpi dash-card--interactive${onClick ? ' dash-card--clickable' : ''}`}
      style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, ['--dash-shadow' as string]: T.shadowRaise }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="dash-kpi__label" style={{ color: T.textSecondary }}>{label}</div>
      <div className="dash-kpi__value" style={{ color: T.textPrimary }}>{format(shown)}</div>
      <div className="dash-kpi__meta" style={{ color: T.textSecondary }}>
        <DeltaPill pct={deltaPct} invert={invertDelta} />
        <span>vs previous window</span>
      </div>
      <div className="dash-spark">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart key={chartKey} data={series} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line type="monotone" dataKey="v" stroke={accent} strokeWidth={2} dot={false} isAnimationActive={!reduced} animationDuration={600} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>(PROMO_SEED);
  const [period, setPeriod] = useState<Period>('30d');
  const [dimension, setDimension] = useState<SpendDimension>('type');
  const [hoverName, setHoverName] = useState<string | null>(null);
  const [filter, setFilter] = useState<DashboardFilter | null>(null);
  const [reduced, setReduced] = useState(false);

  /* Hydrate from the shared mock store so counts match the promotions list. */
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only hydration from localStorage + media query */
    setPromos(loadPromotions());
    setReduced(prefersReducedMotion());
  }, []);

  /* Category order within the selected dimension (spend desc, unfiltered) → stable palette assignment. */
  const categoryOrder = useMemo(() => spendByDimension(promos, dimension).map((c) => c.name), [promos, dimension]);
  const colourOf = (name: string) => categoryColour(name, categoryOrder);

  /* Everything below derives from the filtered list. */
  const filtered = useMemo(() => applyFilter(promos, filter), [promos, filter]);

  const counts = useMemo(() => {
    const c: Record<PromoStatus, number> = { active: 0, scheduled: 0, expired: 0, draft: 0, pending: 0 };
    filtered.forEach((p) => c[p.status]++);
    return c;
  }, [filtered]);

  /* "Needs attention" counts: schedule maths pinned to the report date in lib/dashboard. */
  const needs = useMemo(
    () => ({
      pending: counts.pending,
      alerts: activeBudgetAlerts(filtered).length,
      ending: endingWithin(filtered).length,
      starting: startingWithin(filtered).length,
    }),
    [filtered, counts.pending],
  );

  const series = useMemo(() => deriveDashboardSeries(filtered, period), [filtered, period]);
  const totalBudget = useMemo(() => filtered.reduce((s, p) => s + (p.budget ?? 0), 0), [filtered]);
  const totalSpend = useMemo(() => filtered.reduce((s, p) => s + (p.spend ?? 0), 0), [filtered]);
  const utilisation = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;
  const last = series[series.length - 1];

  /* Hero: cumulative spend; daily deltas feed the spend sparkline. */
  const hero = useMemo(
    () => series.map((pt, i) => ({ day: pt.day, spend: pt.spend, daily: i === 0 ? pt.spend : pt.spend - series[i - 1].spend })),
    [series],
  );
  const pace = totalBudget / 2; /* linear month pace at day 15 of 30 */

  /* Donut + legend (respects filter; a filtered donut shows the single category). */
  const breakdown = useMemo(() => spendByDimension(filtered, dimension), [filtered, dimension]);
  const breakdownTotal = breakdown.reduce((s, c) => s + c.amount, 0);
  const hovered = hoverName ? breakdown.find((c) => c.name === hoverName) : null;

  /* Bars: top 6 promos by spend. */
  const bars = useMemo(
    () =>
      filtered
        .filter((p) => p.budget != null && p.spend != null && p.spend > 0)
        .sort((a, b) => b.spend! - a.spend!)
        .slice(0, 6)
        .map((p) => ({ id: p.id, name: p.name, category: dimensionValue(p, dimension), budget: p.budget!, spend: p.spend!, ratio: p.spend! / p.budget! })),
    [filtered, dimension],
  );

  /* Promotions at or above the alert threshold, worst first. */
  const attention = useMemo(
    () => filtered.filter((p) => p.budget != null && p.spend != null && p.spend / p.budget >= ALERT_RATIO).sort((a, b) => b.spend! / b.budget! - a.spend! / a.budget!),
    [filtered],
  );

  const activity = useMemo(() => deriveActivity(filtered), [filtered]);

  /* KPI deltas: second half of the window vs first half. */
  const halfDelta = (key: 'spend' | 'active' | 'alerts') => {
    if (series.length < 2) return 0;
    const half = Math.floor(series.length / 2);
    const recent = series.slice(-half).reduce((s, p) => s + p[key], 0);
    const prior = series.slice(0, series.length - half).reduce((s, p) => s + p[key], 0);
    return prior === 0 ? (recent === 0 ? 0 : 100) : Math.round(((recent - prior) / prior) * 100);
  };

  const goToList = () => router.push('/admin/promotions');
  const goToApprovals = () => router.push('/admin/promotions/approvals');
  /* Clicking a segment/legend row filters the dashboard by that category; clicking again clears. */
  const toggleFilter = (value: string) => setFilter((cur) => (cur && cur.dimension === dimension && cur.value === value ? null : { dimension, value }));
  /* Switching dimension while a filter is active clears the filter. */
  const switchDimension = (next: SpendDimension) => {
    if (next === dimension) return;
    setDimension(next);
    setHoverName(null);
    setFilter(null);
  };
  const isFiltered = (value: string) => filter?.dimension === dimension && filter.value === value;
  const dim = (name: string) => (hoverName && hoverName !== name ? 0.4 : 1);
  const chartKey = `${period}-${dimension}-${filter?.value ?? 'all'}`;
  const aheadOfPace = totalSpend > pace;

  return (
    <div className="promo-page" style={{ background: T.offWhite }}>
      {/* Top bar: Internal Tool Shell title + market flag + subtitle; period control right. */}
      <div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div className="promo-title-row">
            <h1 className="promo-title" style={{ color: T.textPrimary }}>Dashboard</h1>
            <ZambiaFlag />
            {filter && (
              <button type="button" className="dash-filter-badge" onClick={() => setFilter(null)} aria-label={`Clear filter ${filter.value}`}>
                <Badge color={T.navy}>Filtered: {filter.value} · {periodLabel(period)} ×</Badge>
              </button>
            )}
          </div>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>ionix Boost · {periodLabel(period)}</p>
        </div>
        <div className="dash-topbar__controls">
          <div className="dash-segmented" role="group" aria-label="Period" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusPill }}>
            {PERIODS.map((opt) => {
              const active = opt.value === period;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className="dash-segmented__button"
                  aria-pressed={active}
                  onClick={() => setPeriod(opt.value)}
                  style={{ background: active ? T.navy : 'transparent', color: active ? T.white : T.textSecondary, borderRadius: T.radiusPill }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.offWhite; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="promo-container">
        {/* Needs attention: four action cards; each links through to the relevant list. */}
        <nav className="dash-attention" aria-label="Needs attention">
          <AttentionCard label="Pending approvals" count={needs.pending} icon={ClipboardCheck} accent={T.blue} onOpen={goToApprovals} />
          <AttentionCard label="Budget alerts" count={needs.alerts} icon={AlertTriangle} accent={T.destructiveActive} onOpen={goToList} />
          <AttentionCard label="Ending in 7 days" count={needs.ending} icon={CalendarClock} accent={T.darkGrey} onOpen={goToList} />
          <AttentionCard label="Starting in 7 days" count={needs.starting} icon={CalendarPlus} accent={T.progressActive} onOpen={goToList} />
        </nav>

        {/* KPI cards: count-up values, delta pills, 36px sparklines. */}
        <div className="dash-kpis">
          <KpiCard
            label="Total spend"
            value={totalSpend}
            format={fmtK}
            deltaPct={halfDelta('spend')}
            accent={T.yellow}
            series={hero.map((p) => ({ day: p.day, v: p.daily }))}
            chartKey={chartKey}
            reduced={reduced}
          />
          <KpiCard
            label="Budget utilisation"
            value={utilisation}
            format={fmtPct}
            deltaPct={series.length > 1 ? Math.round(last.utilisation - series[0].utilisation) : 0}
            accent={T.navy}
            series={series.map((p) => ({ day: p.day, v: p.utilisation }))}
            chartKey={chartKey}
            reduced={reduced}
          />
          <KpiCard
            label="Active promotions"
            value={counts.active}
            format={fmtCount}
            deltaPct={halfDelta('active')}
            accent={T.progressActive}
            series={series.map((p) => ({ day: p.day, v: p.active }))}
            chartKey={chartKey}
            reduced={reduced}
          />
          <KpiCard
            label="Budget alerts"
            value={attention.length}
            format={fmtCount}
            deltaPct={halfDelta('alerts')}
            invertDelta
            accent={T.destructiveActive}
            series={series.map((p) => ({ day: p.day, v: p.alerts }))}
            chartKey={chartKey}
            reduced={reduced}
            onClick={goToList}
          />
        </div>

        <div className="dash-grid">
          {/* Hero: Spend over time (cumulative area) vs linear budget pace. */}
          <section className="dash-card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
            <div className="dash-card__header">
              <div>
                <h2 className="dash-card__title" style={{ color: T.textPrimary }}>Spend over time</h2>
                <p className="dash-card__caption" style={{ color: aheadOfPace ? T.destructive : T.textSecondary }}>
                  {aheadOfPace && <TriangleAlert size={12} aria-hidden="true" style={{ verticalAlign: 'middle' }} />}
                  {' '}Cumulative spend · budget {fmtK(totalBudget)} · {aheadOfPace ? 'ahead of' : 'under'} pace
                </p>
              </div>
              {/* Card-owned HTML legend (top-right, 12px); carries the "Budget pace" name. */}
              <div className="dash-legend">
                <LegendItem label="Spend" color={T.yellow} />
                <LegendItem label="Budget pace" color={T.destructiveActive} dashed />
              </div>
            </div>

 {/* right margin 24: the final "15 Sep" tick is centred on the last point,
 so it needs room past the plot edge or the SVG boundary clips it. */}
            <div className="dash-chart">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart key={chartKey} data={hero} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="dash-spend-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.yellowSoft} />
                      <stop offset="100%" stopColor={T.yellowSoft} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={T.chartTrack} vertical={false} />
                  <XAxis dataKey="day" tick={TICK} tickLine={false} axisLine={false} interval={period === '7d' ? 0 : 1} />
                  <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={fmtAxisK} width={64} />
                  <Tooltip cursor={{ stroke: T.ghostBorder }} content={<ChartTooltip formatter={fmtK} />} />
                  {/* Budget pace: dashed, no label (legend above carries the name). */}
                  <ReferenceLine y={pace} stroke={T.destructiveActive} strokeDasharray="4 4" />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    name="Spend"
                    stroke={T.yellow}
                    strokeWidth={2.5}
                    fill="url(#dash-spend-fill)"
                    activeDot={{ r: 6, fill: T.yellow, stroke: T.white, strokeWidth: 2 }}
                    isAnimationActive={!reduced}
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </section>

          {/* Awards credited per day: bar chart */}
          <section className="dash-card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
            <div className="dash-card__header">
              <div>
                <h2 className="dash-card__title" style={{ color: T.textPrimary }}>Spend by {dimension}</h2>
                <p className="dash-card__caption" style={{ color: T.textSecondary }}>Click a segment to filter the dashboard</p>
              </div>
              {/* Dimension toggle: same segmented control as the period switch. */}
              <div className="dash-segmented" role="group" aria-label="Spend breakdown" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusPill }}>
                {DIMENSIONS.map((opt) => {
                  const active = opt.value === dimension;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className="dash-segmented__button"
                      aria-pressed={active}
                      onClick={() => switchDimension(opt.value)}
                      style={{ background: active ? T.navy : 'transparent', color: active ? T.white : T.textSecondary, borderRadius: T.radiusPill }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.offWhite; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {breakdown.length === 0 && filter ? (
              <FilteredEmpty value={filter.value} />
            ) : (
              <>
                <div className="dash-donut">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart key={chartKey}>
                      <Pie
                        data={breakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={96}
                        paddingAngle={2}
                        stroke={T.white}
                        strokeWidth={2}
                        cursor="pointer"
                        isAnimationActive={!reduced}
                        animationDuration={600}
                        onMouseEnter={(_, index: number) => setHoverName(breakdown[index]?.name ?? null)}
                        onMouseLeave={() => setHoverName(null)}
                        onClick={(_, index: number) => { const c = breakdown[index]; if (c) toggleFilter(c.name); }}
                      >
                        {breakdown.map((c) => (
                          <Cell key={c.name} fill={colourOf(c.name)} fillOpacity={dim(c.name)} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centre label: plain HTML over the chart (not a Recharts label). */}
                  <div className="dash-donut__centre">
                    <span className="dash-donut__label" style={{ color: T.textSecondary }}>{hovered ? hovered.name : 'Total'}</span>
                    <span className="dash-donut__amount" style={{ color: T.textPrimary }}>{fmtK(hovered ? hovered.amount : breakdownTotal)}</span>
                    {hovered && (
                      <span className="dash-donut__sub" style={{ color: T.textSecondary }}>{fmtPct(breakdownTotal > 0 ? (hovered.amount / breakdownTotal) * 100 : 0)} of spend</span>
                    )}
                  </div>
                </div>

                {/* Legend rows: clickable filters, mirror hover dimming. */}
                <div className="dash-type-legend">
                  {breakdown.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      className="dash-type-legend__row"
                      aria-pressed={isFiltered(c.name)}
                      onClick={() => toggleFilter(c.name)}
                      onMouseEnter={() => setHoverName(c.name)}
                      onMouseLeave={() => setHoverName(null)}
                      style={{ opacity: dim(c.name), color: T.textPrimary, fontWeight: isFiltered(c.name) ? 600 : 400 }}
                    >
                      <span className="dash-type-legend__dot" style={{ background: colourOf(c.name), borderRadius: T.radiusPill }} aria-hidden="true" />
                      <span className="dash-type-legend__type">{c.name}</span>
                      <span>{fmtK(c.amount)}</span>
                      <span style={{ color: T.textSecondary }}>{fmtPct(breakdownTotal > 0 ? (c.amount / breakdownTotal) * 100 : 0)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Budget vs spend by promotion: horizontal bars, top 6 by spend. */}
        <section className="dash-card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
          <div className="dash-card__header">
            <div>
              <h2 className="dash-card__title" style={{ color: T.textPrimary }}>Budget vs spend by promotion</h2>
              <p className="dash-card__caption" style={{ color: T.textSecondary }}>Top 6 by spend · red outline = at or above 90% of budget · click a bar to open the list</p>
            </div>
            <div className="dash-legend">
              <LegendItem label="Budget" color={T.ghostBorder} />
              <LegendItem label="Spend" color={T.navy} />
            </div>
          </div>

          {bars.length === 0 ? (
            filter ? <FilteredEmpty value={filter.value} /> : <p className="dash-empty" style={{ color: T.textSecondary }}>No promotions have recorded spend.</p>
          ) : (
            <div className="dash-chart dash-chart--bar">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart key={chartKey} data={bars} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }} barCategoryGap="28%" barGap={2}>
                  <CartesianGrid stroke={T.chartTrack} horizontal={false} />
                  <XAxis type="number" tick={TICK} tickLine={false} axisLine={false} tickFormatter={fmtAxisK} />
                  <YAxis type="category" dataKey="name" tick={TICK} tickLine={false} axisLine={false} width={180} />
                  <Tooltip cursor={{ fill: T.selectionBg }} content={<ChartTooltip formatter={fmtK} />} />
                  <Bar dataKey="budget" name="Budget" fill={T.chartTrack} radius={[0, 4, 4, 0]} cursor="pointer" onClick={goToList} isAnimationActive={!reduced} animationDuration={600} />
                  <Bar
                    dataKey="spend"
                    name="Spend"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={goToList}
                    onMouseEnter={(_, index: number) => setHoverName(bars[index]?.category ?? null)}
                    onMouseLeave={() => setHoverName(null)}
                    isAnimationActive={!reduced}
                    animationDuration={600}
                  >
                    {bars.map((b) => (
                      <Cell
                        key={b.id}
                        fill={colourOf(b.category)}
                        fillOpacity={dim(b.category)}
                        stroke={b.ratio >= ALERT_RATIO ? T.destructiveActive : undefined}
                        strokeWidth={b.ratio >= ALERT_RATIO ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Budget attention: promotions at/over the 90% alert threshold. */}
        <section className="dash-card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
          <div className="dash-card__header">
            <div>
              <h2 className="dash-card__title" style={{ color: T.textPrimary }}>Budget attention</h2>
              <p className="dash-card__caption" style={{ color: T.textSecondary }}>
                Promotions at or above 90% of budget. Alerts warn; they never block awarding.
              </p>
            </div>
            <GhostButton small onClick={goToList}>View all promotions</GhostButton>
          </div>

          {attention.length === 0 ? (
            filter ? <FilteredEmpty value={filter.value} /> : <p className="dash-empty" style={{ color: T.textSecondary }}>No promotions are near their budget.</p>
          ) : (
            <ul className="dash-attention__list">
              {attention.map((p, i) => {
                const ratio = p.spend! / p.budget!;
                const pct = Math.min(ratio * 100, 100);
                return (
                  <li key={p.id} className="dash-attention__row" style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.border}` }}>
                    <div className="dash-attention__top">
                      <div>
                        <div className="dash-attention__name" style={{ color: T.textPrimary }}>{p.name}</div>
                        <div className="dash-attention__id" style={{ color: T.textSecondary }}>
                          {p.id} · {p.type}
                        </div>
                      </div>
                      <div className="dash-attention__figures">
                        <Badge color={STATUS[p.status].color} ghost={STATUS[p.status].ghost}>{STATUS[p.status].label}</Badge>
                        <span style={{ color: T.textPrimary }}>
                          {fmtK(p.spend!)} <span style={{ color: T.textSecondary }}>/ {fmtK(p.budget!)}</span>
                        </span>
                        <span className="promo-budget__alert" style={{ color: T.destructive }}>
                          <TriangleAlert size={12} aria-hidden="true" /> {Math.round(ratio * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="promo-budget__track" style={{ background: T.border, borderRadius: T.radiusPill }}>
                      <div className="promo-budget__fill" style={{ width: `${pct}%`, background: T.destructive, borderRadius: T.radiusPill }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recent activity: alerts, activations, scheduled and expired promotions. */}
        <section className="dash-card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
          <div className="dash-card__header">
            <div>
              <h2 className="dash-card__title" style={{ color: T.textPrimary }}>Recent activity</h2>
              <p className="dash-card__caption" style={{ color: T.textSecondary }}>Latest budget alerts, activations and schedule changes</p>
            </div>
            <GhostButton small onClick={goToList}>View all promotions</GhostButton>
          </div>

          {activity.length === 0 ? (
            filter ? <FilteredEmpty value={filter.value} /> : <p className="dash-empty" style={{ color: T.textSecondary }}>No recent activity.</p>
          ) : (
            <ul className="dash-activity__list">
              {activity.map((item, i) => {
                const Icon = ACTIVITY_ICON[item.kind];
                const colour = ACTIVITY_COLOUR[item.kind];
                return (
                  <li
                    key={item.id}
                    className="dash-activity__row"
                    style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.border}`, borderRadius: T.radiusSm }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span className="dash-activity__icon" style={{ background: T.selectionBg, color: colour, borderRadius: T.radiusPill }} aria-hidden="true">
                      <Icon size={16} />
                    </span>
                    <div className="dash-activity__copy">
                      <div className="dash-activity__title" style={{ color: T.textPrimary }}>{item.title}</div>
                      <div className="dash-attention__id" style={{ color: T.textSecondary }}>{item.detail}</div>
                    </div>
                    <span className="dash-activity__time" style={{ color: T.textSecondary }}>{relativeTime(item.minutesAgo)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
