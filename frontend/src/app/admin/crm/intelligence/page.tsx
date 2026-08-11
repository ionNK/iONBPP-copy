'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { Brain, TrendingDown, Target, AlertTriangle, ArrowUpRight, ArrowDownRight, Zap, LineChart, ShieldAlert } from 'lucide-react';
import { Player, getPlayers, riskBand } from '@/data/players';
import { buildQuadrants, buildOpportunities, buildDrivers, scoreBand, rankNba, buildClvSummary, rankAbuseRisk, Opportunity } from '@/data/intelligence';
import { useCountry } from '@/context/CountryContext';
import { features } from '@/config/features';




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
if (!features.intelligence) notFound();
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
    <div className="crm-intelligence-page ds-page-shell">
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
        <div className="kpi glass-panel"><div className="kpi-icon kpi-icon--danger"><TrendingDown size={20} /></div><div><p className="kpi-label">High Churn</p><p className="kpi-value">{highChurn}</p></div></div>
        <div className="kpi glass-panel"><div className="kpi-icon kpi-icon--success"><Target size={20} /></div><div><p className="kpi-label">High Propensity</p><p className="kpi-value">{highPropensity}</p></div></div>
        <div className="kpi glass-panel"><div className="kpi-icon kpi-icon--warning"><AlertTriangle size={20} /></div><div><p className="kpi-label">Players Scored</p><p className="kpi-value">{players.length}</p></div></div>
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

          <h2 className="section-title section-title--spaced">Ranked Players</h2>
          <div className="tabs glass-panel">
            {METRICS.map((m) => (
              <button key={m.key} className={`tab ${metric === m.key ? 'active' : ''}`} onClick={() => setMetric(m.key)}>{m.label}</button>
            ))}
            <span className="tab-hint">{METRICS.find((m) => m.key === metric)?.hint}</span>
          </div>
          <div className="grid-container glass-panel">
            <table className="data-table">
              <thead><tr><th>Player</th><th>Segment</th><th className="crm-intelligence-page__score-column">Score</th><th>Band</th></tr></thead>
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

 <h2 className="section-title section-title--spaced"><Target size={16} /> Next-Best-Action Queue</h2>
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
          <h2 className="section-title section-title--spaced"><LineChart size={16} /> Customer Lifetime Value Forecast</h2>
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
          <div className="grid-container glass-panel crm-intelligence-page__clv-table">
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

          <h2 className="section-title section-title--side-spaced">Behaviour Drivers</h2>
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

          <h2 className="section-title section-title--side-spaced"><ShieldAlert size={16} /> Bonus-Abuse Watchlist</h2>
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

 {/* Styles are centralized in design-system.css under .crm-intelligence-page. */}
    </div>
  );
}

