'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import T from '@/theme/tokens';
import { Badge, GhostButton, StatChip, ZambiaFlag } from '@/components/ui';
import { PROMO_SEED, loadPromotions } from '@/lib/promotions';
import type { Promo, PromoStatus } from '@/lib/promotions';
/* Shared page-skeleton structural classes (top bar, container, chips) */
import '../promotions/promotions.css';
import './dashboard.css';

/* Status pill colours — same mapping as the promotions list. */
const STATUS: Record<PromoStatus, { label: string; color: string; ghost?: boolean }> = {
  active: { label: 'Active', color: T.success },
  scheduled: { label: 'Scheduled', color: T.blue },
  expired: { label: 'Expired', color: T.darkGrey },
  draft: { label: 'Draft', color: T.draft },
  pending: { label: 'Pending approval', color: T.navy, ghost: true },
};

/* Budget alert threshold — BR-6: alert at >=90%, never block. */
const ALERT_RATIO = 0.9;

const fmtK = (n: number) => `K ${n.toLocaleString()}`;
/* Axis tick format — compact thousands ("K 120k"). */
const fmtAxisK = (n: number) => (n >= 1000 ? `K ${Math.round(n / 1000)}k` : `K ${n}`);

/* ---------------------------------------------------------------------------
 * Mock series — September 2026 month-to-date. Static prototype data; the
 * spend series is cumulative so it reads against the linear budget pace.
 * ------------------------------------------------------------------------- */
const DAYS_IN_MONTH = 30;

/* Daily promo spend (ZMW) across all active promotions, 1–15 Sep. */
const DAILY_SPEND = [8200, 7600, 9100, 12400, 14800, 15200, 9800, 8900, 9400, 10200, 11800, 16400, 17100, 10600, 9900];

const MONTHLY_BUDGET = 330000;

interface SpendPoint {
  day: string;
  spend: number;
  pace: number;
}

const SPEND_SERIES: SpendPoint[] = DAILY_SPEND.reduce<SpendPoint[]>((acc, daily, i) => {
  const prev = acc.length ? acc[acc.length - 1].spend : 0;
  acc.push({
    day: `${i + 1} Sep`,
    spend: prev + daily,
    pace: Math.round((MONTHLY_BUDGET / DAYS_IN_MONTH) * (i + 1)),
  });
  return acc;
}, []);

const MTD_SPEND = SPEND_SERIES[SPEND_SERIES.length - 1].spend;
const MTD_PACE = SPEND_SERIES[SPEND_SERIES.length - 1].pace;

/* Awards credited per day, 1–15 Sep (count). */
const AWARDS_SERIES = [
  1240, 1180, 1320, 1710, 1990, 2050, 1410, 1290, 1330, 1460, 1620, 2210, 2340, 1520, 1440,
].map((awards, i) => ({ day: `${i + 1} Sep`, awards }));

const TOTAL_AWARDS = AWARDS_SERIES.reduce((s, p) => s + p.awards, 0);

/* ---------------------------------------------------------------------------
 * Custom tooltip. Recharts' TooltipProps generics fight the payload shape
 * — props typed as `any` on purpose (pragmatic cast, see report).
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

/* Shared axis tick style — Caption 12px, textSecondary. */
const TICK = { fontSize: 12, fill: T.textSecondary };

/* Legend entry — hand-rolled so the "Budget pace" swatch can be dashed. */
function LegendItem({ label, color, dashed }: { label: string; color: string; dashed?: boolean }) {
  return (
    <span className="dash-legend__item" style={{ color: T.textSecondary }}>
      <span className={`dash-legend__swatch${dashed ? ' dash-legend__swatch--dashed' : ''}`} style={{ color }} aria-hidden="true" />
      {label}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>(PROMO_SEED);

  /* Hydrate from the shared mock store so counts match the promotions list. */
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only hydration from localStorage */
    setPromos(loadPromotions());
  }, []);

  const counts = useMemo(() => {
    const c: Record<PromoStatus, number> = { active: 0, scheduled: 0, expired: 0, draft: 0, pending: 0 };
    promos.forEach((p) => c[p.status]++);
    return c;
  }, [promos]);

  /* Promotions at or above the alert threshold, worst first. */
  const attention = useMemo(
    () =>
      promos
        .filter((p) => p.budget != null && p.spend != null && p.spend / p.budget >= ALERT_RATIO)
        .sort((a, b) => (b.spend! / b.budget!) - (a.spend! / a.budget!)),
    [promos],
  );

  const goToList = () => router.push('/admin/promotions');

  const aheadOfPace = MTD_SPEND > MTD_PACE;
  const paceDelta = Math.abs(MTD_SPEND - MTD_PACE);

  return (
    <div className="promo-page" style={{ background: T.offWhite }}>
      {/* Top bar — Internal Tool Shell: title + market flag + subtitle */}
      <div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div className="promo-title-row">
            <h1 className="promo-title" style={{ color: T.textPrimary }}>Dashboard</h1>
            <ZambiaFlag />
          </div>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>ionix Boost · September month-to-date</p>
        </div>
      </div>

      <div className="promo-container">
        {/* Status overview — each chip links through to the promotions list. */}
        <div className="promo-chips">
          <StatChip label="Active" value={counts.active} active={false} onClick={goToList} />
          <StatChip label="Scheduled" value={counts.scheduled} active={false} onClick={goToList} />
          <StatChip label="Pending approval" value={counts.pending} active={false} onClick={goToList} />
          <StatChip label="Draft" value={counts.draft} active={false} onClick={goToList} />
          <StatChip label="Total promotions" value={promos.length} active={false} onClick={goToList} />
        </div>

        <div className="dash-grid">
          {/* Spend vs budget pace — cumulative line + dashed pace line */}
          <section className="dash-card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
            <div className="dash-card__header">
              <div>
                <h2 className="dash-card__title" style={{ color: T.textPrimary }}>Promo spend vs budget pace</h2>
                <p className="dash-card__caption" style={{ color: T.textSecondary }}>
                  Cumulative spend across active promotions · budget {fmtK(MONTHLY_BUDGET)}
                </p>
              </div>
              <div className="dash-card__stat">
                <div className="dash-card__stat-value" style={{ color: T.textPrimary }}>{fmtK(MTD_SPEND)}</div>
                <div className="dash-card__stat-caption" style={{ color: aheadOfPace ? T.destructive : T.success }}>
                  {aheadOfPace && <TriangleAlert size={12} aria-hidden="true" />}
                  {fmtK(paceDelta)} {aheadOfPace ? 'ahead of' : 'under'} pace
                </div>
              </div>
            </div>

 {/* right margin 24 — the final "15 Sep" tick is centred on the last point,
 so it needs room past the plot edge or the SVG boundary clips it. */}
            <div className="dash-chart">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={SPEND_SERIES} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={T.border} vertical={false} />
                  <XAxis dataKey="day" tick={TICK} tickLine={false} axisLine={{ stroke: T.border }} interval={1} />
                  <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={fmtAxisK} width={64} />
                  <Tooltip cursor={{ stroke: T.ghostBorder }} content={<ChartTooltip formatter={fmtK} />} />
                  {/* Month budget ceiling — dashed, no label (legend carries the name). */}
                  <ReferenceLine y={MONTHLY_BUDGET} stroke={T.ghostBorder} strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="pace"
                    name="Budget pace"
                    stroke={T.textSecondary}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    name="Spend"
                    stroke={T.navy}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: T.navy, stroke: T.white, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="dash-legend">
              <LegendItem label="Spend" color={T.navy} />
              <LegendItem label="Budget pace" color={T.textSecondary} dashed />
              <LegendItem label="Month budget" color={T.ghostBorder} dashed />
            </div>
          </section>

          {/* Awards credited per day — bar chart */}
          <section className="dash-card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
            <div className="dash-card__header">
              <div>
                <h2 className="dash-card__title" style={{ color: T.textPrimary }}>Awards credited</h2>
                <p className="dash-card__caption" style={{ color: T.textSecondary }}>Per day · all promotions</p>
              </div>
              <div className="dash-card__stat">
                <div className="dash-card__stat-value" style={{ color: T.textPrimary }}>{TOTAL_AWARDS.toLocaleString()}</div>
                <div className="dash-card__stat-caption" style={{ color: T.textSecondary }}>month to date</div>
              </div>
            </div>

            <div className="dash-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={AWARDS_SERIES} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
                  <CartesianGrid stroke={T.border} vertical={false} />
                  <XAxis dataKey="day" tick={TICK} tickLine={false} axisLine={{ stroke: T.border }} interval={2} />
                  <YAxis tick={TICK} tickLine={false} axisLine={false} width={48} />
                  <Tooltip
                    cursor={{ fill: T.selectionBg }}
                    content={<ChartTooltip formatter={(n: number) => n.toLocaleString()} />}
                  />
                  <Bar dataKey="awards" name="Awards" fill={T.navy} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="dash-legend">
              <LegendItem label="Awards" color={T.navy} />
            </div>
          </section>
        </div>

        {/* Budget attention — promotions at/over the 90% alert threshold. */}
        <section className="dash-card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
          <div className="dash-card__header">
            <div>
              <h2 className="dash-card__title" style={{ color: T.textPrimary }}>Budget attention</h2>
              <p className="dash-card__caption" style={{ color: T.textSecondary }}>
                Promotions at or above 90% of budget. Alerts warn — they never block awarding.
              </p>
            </div>
            <GhostButton small onClick={goToList}>View all promotions</GhostButton>
          </div>

          {attention.length === 0 ? (
            <p className="dash-empty" style={{ color: T.textSecondary }}>No promotions are near their budget.</p>
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
      </div>
    </div>
  );
}
