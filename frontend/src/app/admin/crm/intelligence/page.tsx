'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, TrendingDown, Target, AlertTriangle, ArrowUpRight, ArrowDownRight, Zap, LineChart, ShieldAlert } from 'lucide-react';
import { Player, getPlayers, riskBand } from '@/data/players';
import { buildQuadrants, buildOpportunities, buildDrivers, scoreBand, rankNba, buildClvSummary, rankAbuseRisk, Opportunity } from '@/data/intelligence';
import { useCountry } from '@/context/CountryContext';




type Metric = 'churnScore' | 'promoPropensity' | 'rgRisk';

const METRICS: { key: Metric; label: string; hint: string }[] = [
  { key: 'churnScore', label: 'Churn Risk', hint: 'Likelihood a player stops depositing' },
  { key: 'promoPropensity', label: 'Promo Propensity', hint: 'Responsiveness to bonus offers' },
  { key: 'rgRisk', label: 'RG Risk', hint: 'Responsible-gaming risk signal' },
];

const money = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
};

 export default function IntelligencePage() {
 const router = useRouter();
 const { isInScope, selectedCountry } = useCountry();
 const [allPlayers, setAllPlayers] = useState<Player[]>([]);
 const [metric, setMetric] = useState<Metric>('churnScore');
 useEffect(() => { setAllPlayers(getPlayers()); }, []);

 // Scope every cohort, opportunity and forecast to the market the admin can access.
 const players = allPlayers.filter((p) => isInScope(p.country));

 const ranked = [...players].sort((a, b) => b[metric] - a[metric]);

 const nbaList = rankNba(players);
  const avg = players.length ? Math.round(players.reduce((s, p) => s + p[metric], 0) / players.length) : 0;
  const highChurn = players.filter((p) => p.churnScore >= 66).length;
  const highPropensity = players.filter((p) => p.promoPropensity >= 66).length;

  const quadrants = buildQuadrants(players);
  const opportunities = buildOpportunities(players);
  const drivers = buildDrivers(players);
  const clv = buildClvSummary(players);
  const abuseRows = rankAbuseRisk(players);


  const target = (o: Opportunity) => {
    if (o.metric === 'rg') { router.push('/admin/crm/responsible-gaming'); return; }
    const params = new URLSearchParams({ segmentName: o.segmentName, audience: String(o.count), source: 'intelligence' });
    router.push(`/admin/promotions/create?${params.toString()}`);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
 <h1 className="page-title">Player Behaviour Intelligence</h1>
 <p className="page-subtitle">
 Predictive scores turned into behavioural cohorts and recommended actions.
 {' · '}{selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'All markets'} · {players.length} players in scope.
 </p>

        </div>
      </div>

      <div className="int-kpis">
        <div className="kpi glass-panel"><div className="kpi-icon"><Brain size={20} /></div><div><p className="kpi-label">Avg Score</p><p className="kpi-value">{avg}</p></div></div>
        <div className="kpi glass-panel"><div className="kpi-icon" style={{ color: '#f87171' }}><TrendingDown size={20} /></div><div><p className="kpi-label">High Churn</p><p className="kpi-value">{highChurn}</p></div></div>
        <div className="kpi glass-panel"><div className="kpi-icon" style={{ color: '#699951' }}><Target size={20} /></div><div><p className="kpi-label">High Propensity</p><p className="kpi-value">{highPropensity}</p></div></div>
        <div className="kpi glass-panel"><div className="kpi-icon" style={{ color: '#fb923c' }}><AlertTriangle size={20} /></div><div><p className="kpi-label">Players Scored</p><p className="kpi-value">{players.length}</p></div></div>
      </div>

      <div className="cols">
        {/* Behaviour matrix */}
        <div className="col-main">
          <h2 className="section-title">Behaviour Segments</h2>
          <div className="matrix">
            {quadrants.map((q) => (
              <div key={q.key} className="quad glass-panel" style={{ borderTopColor: q.color }}>
                <div className="quad-head">
                  <span className="quad-dot" style={{ background: q.color }} />
                  <span className="quad-label">{q.label}</span>
                  <span className="quad-count">{q.players.length}</span>
                </div>
                <p className="quad-desc">{q.description}</p>
                <p className="quad-ltv">{money(q.totalLtv)} <span>lifetime value</span></p>
              </div>
            ))}
          </div>

          <h2 className="section-title" style={{ marginTop: 28 }}>Ranked Players</h2>
          <div className="tabs glass-panel">
            {METRICS.map((m) => (
              <button key={m.key} className={`tab ${metric === m.key ? 'active' : ''}`} onClick={() => setMetric(m.key)}>{m.label}</button>
            ))}
            <span className="tab-hint">{METRICS.find((m) => m.key === metric)?.hint}</span>
          </div>
          <div className="grid-container glass-panel">
            <table className="data-table">
              <thead><tr><th>Player</th><th>Segment</th><th style={{ width: '40%' }}>Score</th><th>Band</th></tr></thead>
              <tbody>
                {ranked.map((p) => {
                  const val = p[metric];
                  const band = riskBand(val);
                  return (
                    <tr key={p.id}>
                      <td><Link href={`/admin/crm/${p.id}`} className="cell-title">{p.name}</Link><div className="cell-sub">{p.id}</div></td>
                      <td className="text-secondary">{p.lifecycle}</td>
                      <td>
                        <div className="score-row">
                          <div className="score-track"><div className="score-fill" style={{ width: `${val}%`, background: band.color }} /></div>
                          <span className="score-val">{val}</span>
                        </div>
                      </td>
                      <td><span className="band" style={{ color: band.color, borderColor: band.color }}>{band.label}</span></td>
                    </tr>
                  );
                })}
 </tbody>
 </table>
 </div>

 <h2 className="section-title" style={{ marginTop: 28 }}><Target size={16} /> Next-Best-Action Queue</h2>
 <p className="nba-sub">Per-player recommendations, prioritised by urgency and confidence. RG cases suppress marketing.</p>
 <div className="nba-list">
 {nbaList.slice(0, 8).map(({ player, nba }) => (
 <div key={player.id} className={`nba glass-panel u-${nba.priority}`}>
 <div className="nba-left">
 <Link href={`/admin/crm/${player.id}`} className="nba-name">{player.name}</Link>
 <span className="nba-title">{nba.title}</span>
 <span className="nba-reason">{nba.rationale}</span>
 </div>
 <div className="nba-right">
 <span className={`nba-badge u-${nba.priority}`}>{nba.priority}</span>
 <span className="nba-chip">{nba.channel}</span>
 <span className="nba-offer">{nba.offer}</span>
 <span className="nba-conf">{nba.confidence}% conf.</span>
 </div>
 </div>
            ))}
          </div>

          {/* CLV forecast */}
          <h2 className="section-title" style={{ marginTop: 28 }}><LineChart size={16} /> Customer Lifetime Value Forecast</h2>
          <p className="nba-sub">12-month projected value modelled from ARPU, deposit cadence and retention (inverse of churn).</p>
          <div className="clv-summary">
            <div className="clv-stat glass-panel">
              <p className="clv-stat-label">Current LTV</p>
              <p className="clv-stat-val">{money(clv.currentTotal)}</p>
            </div>
            <div className="clv-stat glass-panel">
              <p className="clv-stat-label">Projected (12mo)</p>
              <p className="clv-stat-val">{money(clv.projectedTotal)}</p>
            </div>
            <div className="clv-stat glass-panel accent">
              <p className="clv-stat-label">Forecast Uplift</p>
              <p className="clv-stat-val up">+{money(clv.upliftTotal)} <span>+{clv.upliftPct}%</span></p>
            </div>
          </div>
          <div className="grid-container glass-panel" style={{ marginTop: 14 }}>
            <table className="data-table">
              <thead><tr><th>Player</th><th>Current</th><th>Projected</th><th>Uplift</th><th>Retention</th><th>Conf.</th></tr></thead>
              <tbody>
                {clv.top.map(({ player, forecast }) => (
                  <tr key={player.id}>
                    <td><Link href={`/admin/crm/${player.id}`} className="cell-title">{player.name}</Link><div className="cell-sub">{player.lifecycle}</div></td>
                    <td className="text-secondary">{money(forecast.current)}</td>
                    <td className="cell-title">{money(forecast.projected)}</td>
                    <td><span className="up">+{money(forecast.uplift)}</span> <span className="cell-sub">+{forecast.upliftPct}%</span></td>
                    <td className="text-secondary">{Math.round(forecast.retention * 100)}%</td>
                    <td className="text-secondary">{forecast.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: opportunities + drivers */}


        <div className="col-side">
          <h2 className="section-title"><Zap size={16} /> Opportunities</h2>
          <div className="opp-list">
            {opportunities.length === 0 && <p className="empty">No signals detected in the current cohort.</p>}
            {opportunities.map((o) => (
              <div key={o.id} className={`opp glass-panel u-${o.urgency}`}>
                <div className="opp-top">
                  <span className="opp-title">{o.title}</span>
                  <span className={`opp-badge u-${o.urgency}`}>{o.urgency}</span>
                </div>
                <p className="opp-insight">{o.insight}</p>
                <div className="opp-foot">
                  <span className="opp-meta">{o.count} players · {money(o.totalLtv)}</span>
                  <button className="opp-btn" onClick={() => target(o)}>{o.action} <ArrowUpRight size={13} /></button>
                </div>
              </div>
            ))}
          </div>

          <h2 className="section-title" style={{ marginTop: 24 }}>Behaviour Drivers</h2>
          <div className="drivers glass-panel">
            {drivers.map((d) => (
              <div key={d.label} className="driver">
                <div className="driver-head">
                  {d.direction === 'up' ? <ArrowUpRight size={14} className="dir-up" /> : <ArrowDownRight size={14} className="dir-down" />}
                  <span className="driver-label">{d.label}</span>
                  <span className="driver-share">{d.share}%</span>
                </div>
                <p className="driver-detail">{d.detail}</p>
                <div className="driver-track"><div className="driver-fill" style={{ width: `${d.share}%`, background: scoreBand(d.share).color }} /></div>
              </div>
            ))}
          </div>

          <h2 className="section-title" style={{ marginTop: 24 }}><ShieldAlert size={16} /> Bonus-Abuse Watchlist</h2>
          <div className="abuse-list">
            {abuseRows.length === 0 && <p className="empty">No abuse signals in the current cohort.</p>}
            {abuseRows.map(({ player, risk }) => (
              <div key={player.id} className="abuse glass-panel" style={{ borderLeftColor: risk.band.color }}>
                <div className="abuse-top">
                  <Link href={`/admin/crm/${player.id}`} className="abuse-name">{player.name}</Link>
                  <span className="abuse-score" style={{ color: risk.band.color, borderColor: risk.band.color }}>{risk.score} · {risk.band.label}</span>
                </div>
                <div className="abuse-reasons">
                  {risk.reasons.map((r) => <span key={r} className="abuse-chip">{r}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      <style jsx>{STYLES}</style>
    </div>
  );
}

const STYLES = `
  .page-container { max-width: 1400px; margin: 0 auto; }
  .page-header { margin-bottom: 24px; }
  .page-title { font-size: 28px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px 0; }
  .page-subtitle { font-size: 14px; color: var(--color-text-secondary); margin: 0; }
  .int-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .kpi { display: flex; align-items: center; gap: 14px; padding: 18px 20px; }
  .kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--color-bg-input); color: var(--color-accent-purple, #a855f7); }
  .kpi-label { font-size: 12px; color: var(--color-text-muted); margin: 0 0 2px 0; text-transform: uppercase; }
  .kpi-value { font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin: 0; }

  .cols { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 14px 0; }

  .matrix { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .quad { padding: 16px; border-top: 3px solid; }
  .quad-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .quad-dot { width: 8px; height: 8px; border-radius: 50%; }
  .quad-label { font-size: 14px; font-weight: 700; color: var(--color-text-primary); }
  .quad-count { margin-left: auto; font-size: 16px; font-weight: 700; color: var(--color-text-primary); }
  .quad-desc { font-size: 12px; color: var(--color-text-secondary); margin: 0 0 10px 0; line-height: 1.5; min-height: 34px; }
  .quad-ltv { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
  .quad-ltv span { font-size: 11px; font-weight: 500; color: var(--color-text-muted); }

  .tabs { display: flex; align-items: center; gap: 8px; padding: 12px 16px; margin-bottom: 16px; }
  .tab { background: var(--color-bg-input); border: 1px solid var(--color-border); color: var(--color-text-secondary); padding: 6px 14px; font-size: 13px; font-weight: 500; cursor: pointer; border-radius: 6px; }
  .tab.active { background: var(--color-betika-yellow, #F2D641); color: #000; border-color: var(--color-betika-yellow, #F2D641); }
  .tab-hint { margin-left: auto; font-size: 12px; color: var(--color-text-muted); }

  .grid-container { display: flex; flex-direction: column; }
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { text-align: left; padding: 14px 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); background: var(--color-bg-input); }
  .data-table td { padding: 14px 20px; border-bottom: 1px solid var(--color-border); font-size: 14px; color: var(--color-text-secondary); vertical-align: middle; }
  .data-table tr:last-child td { border-bottom: none; }
  .cell-title { color: var(--color-text-primary); font-weight: 600; text-decoration: none; }
  .cell-title:hover { color: var(--color-betika-yellow, #F2D641); }
  .cell-sub { font-size: 11px; color: var(--color-text-muted); }
  .text-secondary { color: var(--color-text-secondary); text-transform: capitalize; }
  .score-row { display: flex; align-items: center; gap: 12px; }
  .score-track { flex: 1; height: 8px; border-radius: 4px; background: var(--color-bg-input); overflow: hidden; }
  .score-fill { height: 100%; border-radius: 4px; }
  .score-val { font-size: 13px; font-weight: 600; color: var(--color-text-primary); width: 28px; }
  .band { font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 3px 10px; border: 1px solid currentColor; border-radius: 20px; }

  .opp-list { display: flex; flex-direction: column; gap: 12px; }
  .empty { font-size: 13px; color: var(--color-text-muted); padding: 12px; }
  .opp { padding: 14px 16px; border-left: 3px solid var(--color-border); }
  .opp.u-high { border-left-color: #f87171; }
  .opp.u-medium { border-left-color: #fb923c; }
  .opp.u-low { border-left-color: #699951; }
  .opp-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .opp-title { font-size: 14px; font-weight: 700; color: var(--color-text-primary); }
  .opp-badge { margin-left: auto; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 20px; }
  .opp-badge.u-high { background: rgba(248,113,113,0.18); color: #f87171; }
  .opp-badge.u-medium { background: rgba(251,146,60,0.18); color: #fb923c; }
  .opp-badge.u-low { background: rgba(105,153,81,0.2); color: #699951; }
  .opp-insight { font-size: 12px; color: var(--color-text-secondary); line-height: 1.5; margin: 0 0 12px 0; }
  .opp-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .opp-meta { font-size: 11px; color: var(--color-text-muted); }
  .opp-btn { display: inline-flex; align-items: center; gap: 4px; background: var(--color-betika-yellow, #F2D641); color: #000; border: none; padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; }
 .opp-btn:hover { filter: brightness(0.95); }

 .nba-sub { font-size: 12px; color: var(--color-text-muted); margin: -6px 0 14px 0; }
 .nba-list { display: flex; flex-direction: column; gap: 10px; }
 .nba { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; border-left: 3px solid var(--color-border); }
 .nba.u-high { border-left-color: #f87171; }
 .nba.u-medium { border-left-color: #fb923c; }
 .nba.u-low { border-left-color: #699951; }
 .nba-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
 .nba-name { font-size: 13px; font-weight: 700; color: var(--color-text-primary); text-decoration: none; }
 .nba-name:hover { color: var(--color-betika-yellow, #F2D641); }
 .nba-title { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
 .nba-reason { font-size: 11px; color: var(--color-text-muted); line-height: 1.45; }
 .nba-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
 .nba-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 20px; }
 .nba-badge.u-high { background: rgba(248,113,113,0.18); color: #f87171; }
 .nba-badge.u-medium { background: rgba(251,146,60,0.18); color: #fb923c; }
 .nba-badge.u-low { background: rgba(105,153,81,0.2); color: #699951; }
 .nba-chip { font-size: 11px; font-weight: 600; color: var(--color-text-secondary); background: var(--color-bg-input); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: 6px; }
 .nba-offer { font-size: 11px; color: var(--color-text-secondary); }
 .nba-conf { font-size: 11px; font-weight: 600; color: var(--color-text-muted); }

 .drivers { padding: 16px; display: flex; flex-direction: column; gap: 16px; }

  .driver-head { display: flex; align-items: center; gap: 6px; }
  .driver-label { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
  .driver-share { margin-left: auto; font-size: 13px; font-weight: 700; color: var(--color-text-primary); }
  .dir-up { color: #699951; }
  .dir-down { color: #f87171; }
  .driver-detail { font-size: 11px; color: var(--color-text-muted); margin: 2px 0 6px 0; }
  .driver-track { height: 6px; border-radius: 3px; background: var(--color-bg-input); overflow: hidden; }
  .driver-fill { height: 100%; border-radius: 3px; }

  .clv-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 4px; }
  .clv-stat { padding: 16px 18px; }
  .clv-stat.accent { border: 1px solid rgba(105,153,81,0.4); }
  .clv-stat-label { font-size: 11px; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 6px 0; }
  .clv-stat-val { font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
  .clv-stat-val.up { color: #699951; }
  .clv-stat-val span { font-size: 12px; font-weight: 600; }
  .up { color: #699951; font-weight: 600; }

  .abuse-list { display: flex; flex-direction: column; gap: 10px; }
  .abuse { padding: 12px 14px; border-left: 3px solid var(--color-border); }
  .abuse-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
  .abuse-name { font-size: 13px; font-weight: 700; color: var(--color-text-primary); text-decoration: none; }
  .abuse-name:hover { color: var(--color-betika-yellow, #F2D641); }
  .abuse-score { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border: 1px solid currentColor; border-radius: 20px; }
  .abuse-reasons { display: flex; flex-wrap: wrap; gap: 6px; }
  .abuse-chip { font-size: 10px; color: var(--color-text-secondary); background: var(--color-bg-input); border: 1px solid var(--color-border); padding: 2px 8px; border-radius: 6px; }

  @media (max-width: 1100px) { .cols { grid-template-columns: 1fr; } .matrix { grid-template-columns: repeat(2, 1fr); } }

  @media (max-width: 900px) { .int-kpis { grid-template-columns: repeat(2, 1fr); } }
`;

