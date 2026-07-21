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
    <div className="page-container">
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



      <style jsx>{`
        .page-container { max-width: 1400px; margin: 0 auto; }
        .page-header { margin-bottom: 24px; }
        .page-title { font-size: 28px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px 0; }
        .page-subtitle { font-size: 14px; color: var(--color-text-secondary); margin: 0; }
        .an-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .kpi { display: flex; flex-direction: column; gap: 4px; padding: 18px 20px; transition: transform 0.15s, border-color 0.15s; }
        .kpi:hover { transform: translateY(-2px); }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .kpi-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .kpi-label { font-size: 12px; color: var(--color-text-secondary); margin: 0; font-weight: 500; }
        .kpi-value { font-size: 26px; font-weight: 700; color: var(--color-text-primary); margin: 0; letter-spacing: -0.01em; }
        .kpi-delta { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
        .kpi-delta.up { color: #699951; background: rgba(105,153,81,0.14); }
        .kpi-delta.down { color: #f87171; background: rgba(248,113,113,0.14); }
        .kpi-hint { font-size: 11px; color: var(--color-text-muted); margin: 2px 0 0 0; }
        .an-charts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px; }
        .chart { padding: 24px; }
        .panel-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
        .chart-sub { font-size: 12px; color: var(--color-text-muted); margin: 3px 0 0 0; }
        .panel-ico { color: var(--color-text-muted); flex-shrink: 0; }
        .trend-card { margin-bottom: 16px; }
        .legend { display: flex; gap: 16px; }
        .legend span { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-text-secondary); }
        .legend i { width: 12px; height: 3px; border-radius: 2px; display: inline-block; }
        .trend-plot { display: flex; gap: 12px; }
        .y-axis { display: flex; flex-direction: column; justify-content: space-between; height: 220px; text-align: right; padding-bottom: 4px; }
        .y-axis span { font-size: 10px; color: var(--color-text-muted); line-height: 1; }
        .trend-svg { flex: 1; height: 220px; display: block; overflow: visible; }
        .trend-x { display: grid; grid-template-columns: repeat(12, 1fr); margin-top: 8px; padding-left: 52px; }
        .trend-x span { font-size: 11px; color: var(--color-text-muted); text-align: center; }

        .funnel { display: flex; flex-direction: column; gap: 12px; }
        .funnel-row { display: grid; grid-template-columns: 110px 1fr 44px; align-items: center; gap: 12px; }
        .funnel-label { font-size: 13px; color: var(--color-text-secondary); }
        .funnel-track { height: 26px; border-radius: 6px; background: var(--color-bg-input); overflow: hidden; }
        .funnel-fill { height: 100%; display: flex; align-items: center; padding-left: 10px; font-size: 12px; font-weight: 700; color: #fff; background: linear-gradient(90deg, #699951, #84cc16); border-radius: 6px; min-width: 28px; transition: width 0.3s; }
        .funnel-pct { font-size: 13px; font-weight: 600; color: var(--color-text-primary); text-align: right; }
        .leaders { display: flex; flex-direction: column; gap: 4px; }
        .leader-row { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 8px; }
        .leader-row:nth-child(odd) { background: var(--color-bg-input); }
        .leader-rank { width: 22px; height: 22px; border-radius: 6px; background: var(--color-bg-secondary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--color-text-secondary); }
        .leader-info { display: flex; flex-direction: column; flex: 1; }
        .leader-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
        .leader-meta { font-size: 12px; color: var(--color-text-muted); text-transform: capitalize; }
        .leader-ltv { font-size: 14px; font-weight: 700; color: #699951; }

        .chart-title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin: 0 0 20px 0; }
        .bars { display: flex; flex-direction: column; gap: 14px; }
        .bar-row { display: grid; grid-template-columns: 90px 1fr 80px; align-items: center; gap: 12px; }
        .bar-label { font-size: 13px; color: var(--color-text-secondary); display: inline-flex; align-items: center; gap: 7px; }
        .bar-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .bar-track { height: 10px; border-radius: 6px; background: var(--color-bg-input); overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 6px; transition: width 0.3s; }
        .bar-val { font-size: 13px; font-weight: 600; color: var(--color-text-primary); text-align: right; display: flex; flex-direction: column; }
        .bar-val em { font-size: 10px; font-weight: 500; font-style: normal; color: var(--color-text-muted); }
        .rank-1 { background: rgba(242,214,65,0.18) !important; color: #F2D641 !important; }
        .rank-2 { background: rgba(148,163,184,0.2) !important; color: #cbd5e1 !important; }
        .rank-3 { background: rgba(251,146,60,0.18) !important; color: #fb923c !important; }

        @media (max-width: 1000px) { .an-charts { grid-template-columns: 1fr; } .an-kpis { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}
