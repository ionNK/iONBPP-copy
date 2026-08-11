'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, Users, PieChart,
  Gift, Gem, LucideIcon,
} from 'lucide-react';
import { Player, getPlayers, formatCurrency } from '@/data/players';
import {
  buildKpis, lifecycleDist, productDist, marketDist, riskDist,
  revenueTrend, topPlayers, lifecycleFunnel, DistRow,
} from '@/data/analytics';
import { useCountry } from '@/context/CountryContext';
import { features } from '@/config/features';
import { notFound } from 'next/navigation';


const KPI_ICONS: Record<string, { icon: LucideIcon; tint: string }> = {
  ngr: { icon: TrendingUp, tint: '#38bdf8' },
  ggr: { icon: DollarSign, tint: '#699951' },
  deposits: { icon: Wallet, tint: '#F2D641' },
  arpu: { icon: Users, tint: '#a855f7' },
  bonus: { icon: Gift, tint: '#fb923c' },
  ltv: { icon: Gem, tint: '#34d399' },
};

function DistPanel({ title, subtitle, rows, unit, money }: { title: string; subtitle: string; rows: DistRow[]; unit: 'count' | 'value'; money?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => (unit === 'value' ? r.value : r.count)));
  const total = rows.reduce((s, r) => s + (unit === 'value' ? r.value : r.count), 0) || 1;
  return (
    <div className="chart glass-panel">
      <div className="panel-head">
        <div><h2 className="chart-title">{title}</h2><p className="chart-sub">{subtitle}</p></div>
        <PieChart size={16} className="panel-ico" />
      </div>
      <div className="bars">
        {rows.map((r) => {
          const metric = unit === 'value' ? r.value : r.count;
          const pct = Math.round((metric / total) * 100);
          return (
            <div key={r.key} className="bar-row">
              <span className="bar-label"><i className="bar-dot" style={{ background: r.color }} />{r.label}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(metric / max) * 100}%`, background: r.color }} /></div>
              <span className="bar-val">{money ? metric.toLocaleString() : metric.toLocaleString()}<em>{pct}%</em></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export default function AnalyticsPage() {
if (!features.dashboardAnalytics) notFound();
 const { isInScope, selectedCountry } = useCountry();
 const [players, setPlayers] = useState<Player[]>([]);
 useEffect(() => { setPlayers(getPlayers()); }, []);

 // Scope all data to the market(s) the current admin can access.
 const scoped = players.filter((p) => isInScope(p.country));

 const kpis = useMemo(() => buildKpis(scoped), [scoped]);
 const lifecycle = useMemo(() => lifecycleDist(scoped), [scoped]);
 const products = useMemo(() => productDist(scoped), [scoped]);
 const markets = useMemo(() => marketDist(scoped), [scoped]);
 const risk = useMemo(() => riskDist(scoped), [scoped]);
 const trend = useMemo(() => revenueTrend(scoped), [scoped]);
 const leaders = useMemo(() => topPlayers(scoped), [scoped]);
 const funnel = useMemo(() => lifecycleFunnel(scoped), [scoped]);

  const maxTrend = Math.max(1, ...trend.map((t) => Math.max(t.ggr, t.deposits)));
  const pointsFor = (key: 'ggr' | 'ngr' | 'deposits') =>
    trend.map((t, i) => `${(i / (trend.length - 1)) * 100},${100 - (t[key] / maxTrend) * 92}`).join(' ');

  return (
    <div className="crm-analytics-page ds-page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">
            Portfolio revenue, cohorts and risk across the synced player base.
            {' · '}{selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'All markets'} · {scoped.length} players in scope.
          </p>

        </div>
      </div>

      <div className="an-kpis">
        {kpis.map((k) => {
          const meta = KPI_ICONS[k.key] || { icon: DollarSign, tint: '#699951' };
          const Icon = meta.icon;
          return (
            <div key={k.key} className="kpi glass-panel">
              <div className="kpi-top">
                <div className="kpi-icon" style={{ color: meta.tint, background: `${meta.tint}1f` }}><Icon size={18} /></div>
                <span className={`kpi-delta ${k.delta >= 0 ? 'up' : 'down'}`}>
                  {k.delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(k.delta)}%
                </span>
              </div>
              <p className="kpi-value">{k.value}</p>
              <p className="kpi-label">{k.label}</p>
              <p className="kpi-hint">{k.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="chart glass-panel trend-card">
        <div className="panel-head">
          <div>
            <h2 className="chart-title">Revenue Trend</h2>
            <p className="chart-sub">Weekly GGR, NGR & deposits over the last 12 weeks</p>
          </div>
          <div className="legend">
            <span><i style={{ background: '#699951' }} />GGR</span>
            <span><i style={{ background: '#38bdf8' }} />NGR</span>
            <span><i style={{ background: '#F2D641' }} />Deposits</span>
          </div>
        </div>
        <div className="trend-plot">
          <div className="y-axis">
            {[100, 75, 50, 25, 0].map((p) => (
              <span key={p}>{Math.round((maxTrend * p) / 100).toLocaleString()}</span>
            ))}
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="trend-svg">
            <defs>
              <linearGradient id="ggrFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#699951" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#699951" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[25, 50, 75].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--color-border)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
            ))}
            <polygon points={`0,100 ${pointsFor('ggr')} 100,100`} fill="url(#ggrFill)" />
            <polyline points={pointsFor('deposits')} fill="none" stroke="#F2D641" strokeWidth="1.25" vectorEffect="non-scaling-stroke" strokeDasharray="3 2" opacity="0.9" />
            <polyline points={pointsFor('ggr')} fill="none" stroke="#699951" strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            <polyline points={pointsFor('ngr')} fill="none" stroke="#38bdf8" strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="trend-x">{trend.map((t, i) => <span key={t.label}>{i % 2 === 0 ? t.label : ''}</span>)}</div>
      </div>

      <div className="an-charts">
        <DistPanel title="Revenue by Product" subtitle="Net gaming revenue split" rows={products} unit="value" money />
        <DistPanel title="Top Markets" subtitle="Highest revenue countries" rows={markets} unit="value" money />
        <DistPanel title="Players by Lifecycle" subtitle="Cohort headcount" rows={lifecycle} unit="count" />
        <DistPanel title="Churn Risk" subtitle="Portfolio risk banding" rows={risk} unit="count" />
      </div>

      <div className="an-charts">
        <div className="chart glass-panel">
          <div className="panel-head">
            <div><h2 className="chart-title">Lifecycle Funnel</h2><p className="chart-sub">Acquisition to high-value conversion</p></div>
          </div>
          <div className="funnel">
            {funnel.map((s, i) => (
              <div key={s.key} className="funnel-row">
                <span className="funnel-label">{s.label}</span>
                <div className="funnel-track">
                  <div className="funnel-fill" style={{ width: `${Math.max(s.pct, 6)}%`, opacity: 1 - i * 0.13 }}>{s.count}</div>
                </div>
                <span className="funnel-pct">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart glass-panel">
          <div className="panel-head">
            <div><h2 className="chart-title">Top Players</h2><p className="chart-sub">Ranked by lifetime value</p></div>
          </div>
          <div className="leaders">
            {leaders.map((p, i) => (
              <div key={p.id} className="leader-row">
                <span className={`leader-rank rank-${i + 1}`}>{i + 1}</span>
                <div className="leader-info">
                  <span className="leader-name">{p.name}</span>
                  <span className="leader-meta">{p.country} · {p.lifecycle}</span>
                </div>
                <span className="leader-ltv">{formatCurrency(p.ltv, p.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>



 {/* Styles are centralized in design-system.css under .crm-analytics-page. */}
    </div>
  );
}
