'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Users, RefreshCw, TrendingUp, DollarSign, AlertTriangle, ArrowRight } from 'lucide-react';
import {
 Player,
 PlayerLifecycle,
 getPlayers,
 resyncPlayers,
 getLastSync,
 timeAgo,
 formatCurrency,
 LIFECYCLE_META,
 lifecycleBreakdown,
} from '@/data/players';

import { useCountry } from '@/context/CountryContext';


export default function CrmOverviewPage() {

  const { isInScope, selectedCountry } = useCountry();
  const [players, setPlayers] = useState<Player[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);


  useEffect(() => {
    setPlayers(getPlayers());
    setLastSync(getLastSync());
  }, []);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      const { players: fresh, syncedAt } = resyncPlayers();
      setPlayers([...fresh]);
      setLastSync(syncedAt);
      setSyncing(false);
    }, 900);
  };

  // Scope all data to the market(s) the current admin can access.
  const scoped = players.filter((p) => isInScope(p.country));

  const totalLtv = scoped.reduce((sum, p) => sum + p.ltv, 0);
  const activeCount = scoped.filter((p) => ['active', 'vip', 'reactivated'].includes(p.lifecycle)).length;
  const atRiskCount = scoped.filter((p) => p.lifecycle === 'at_risk' || p.rgRisk >= 60).length;

  // Lifecycle distribution across the scoped base.
  const breakdown = lifecycleBreakdown(scoped);
  const maxSeg = Math.max(1, ...Object.values(breakdown));
  const segmentRows = (Object.keys(LIFECYCLE_META) as PlayerLifecycle[])
    .map((k) => ({ key: k, count: breakdown[k] }))
    .sort((a, b) => b.count - a.count);

  // Market split (players & LTV by country).
  const marketMap = new Map<string, { count: number; ltv: number }>();
  scoped.forEach((p) => {
    const m = marketMap.get(p.country) || { count: 0, ltv: 0 };
    m.count += 1;
    m.ltv += p.ltv;
    marketMap.set(p.country, m);
  });
  const markets = Array.from(marketMap.entries())
    .map(([country, v]) => ({ country, ...v }))
    .sort((a, b) => b.ltv - a.ltv);

  // Top players by lifetime value.
  const topPlayers = [...scoped].sort((a, b) => b.ltv - a.ltv).slice(0, 6);




  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">CRM Overview</h1>
          <p className="page-subtitle">
            Portfolio health at a glance.
            {' · '}{selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'All markets'}
            {lastSync ? ` · last sync ${timeAgo(lastSync)}` : ' · not yet synced'}.
          </p>



        </div>
        <div className="header-actions">
          <button className="btn btn-primary crm-new" onClick={handleSync} disabled={syncing}>
            <RefreshCw size={18} className={syncing ? 'spin' : ''} /> {syncing ? 'Syncing…' : 'Sync from Platform'}
          </button>
        </div>
      </div>


      {/* KPI cards */}
      <div className="crm-kpis">
        <div className="kpi glass-panel">
          <div className="kpi-icon"><Users size={20} /></div>
          <div>
                <p className="kpi-label">Total Players</p>
                <p className="kpi-value">{scoped.length}</p>


          </div>
        </div>
        <div className="kpi glass-panel">
          <div className="kpi-icon"><TrendingUp size={20} /></div>
          <div>
            <p className="kpi-label">Active / VIP</p>
            <p className="kpi-value">{activeCount}</p>
          </div>
        </div>
        <div className="kpi glass-panel">
          <div className="kpi-icon" style={{ color: '#F2D641' }}><Users size={20} /></div>
          <div>
            <p className="kpi-label">At Risk</p>
            <p className="kpi-value">{atRiskCount}</p>
          </div>
        </div>
        <div className="kpi glass-panel">
          <div className="kpi-icon"><DollarSign size={20} /></div>
          <div>
            <p className="kpi-label">Total LTV (indexed)</p>
            <p className="kpi-value">{totalLtv.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Two-column analytics row */}
      <div className="overview-grid">
        {/* Lifecycle distribution */}
        <div className="glass-panel panel">
          <div className="panel-head">
            <h2 className="panel-title">Lifecycle Distribution</h2>
            <Link href="/admin/crm/segments" className="panel-link">Segments <ArrowRight size={13} /></Link>
          </div>
          <div className="seg-list">
            {segmentRows.map(({ key, count }) => (
              <div className="seg-row" key={key}>
                <span className="seg-label" style={{ color: LIFECYCLE_META[key].color }}>{LIFECYCLE_META[key].label}</span>
                <div className="seg-bar-track">
                  <div className="seg-bar-fill" style={{ width: `${(count / maxSeg) * 100}%`, background: LIFECYCLE_META[key].color }} />
                </div>
                <span className="seg-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Market split */}
        <div className="glass-panel panel">
          <div className="panel-head">
            <h2 className="panel-title">Market Breakdown</h2>
            <Link href="/admin/crm/analytics" className="panel-link">Analytics <ArrowRight size={13} /></Link>
          </div>
          <div className="market-list">
            {markets.map((m) => (
              <div className="market-row" key={m.country}>
                <span className="market-name">{m.country}</span>
                <span className="market-meta">{m.count} players</span>
                <span className="market-ltv">{m.ltv.toLocaleString()} LTV</span>
              </div>
            ))}
            {markets.length === 0 && <p className="empty">No players in scope.</p>}
          </div>
        </div>
      </div>

      {/* Top players by value */}
      <div className="grid-container glass-panel">
        <div className="panel-head" style={{ padding: '16px 24px' }}>
          <h2 className="panel-title">Top Players by Lifetime Value</h2>
          <Link href="/admin/crm/players" className="panel-link">View all <ArrowRight size={13} /></Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Product</th>
              <th>Lifecycle</th>
              <th>Lifetime Value</th>
              <th>RG Risk</th>
            </tr>
          </thead>
          <tbody>
            {topPlayers.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/crm/${c.id}`} className="cell-title hover-link">{c.name}</Link>
                </td>
                <td><span className="type-badge">{c.primaryProduct}</span></td>
                <td><CrmStatus lifecycle={c.lifecycle} /></td>
                <td className="text-secondary">{formatCurrency(c.ltv, c.currency)}</td>
                <td>
                  {c.rgRisk >= 60
                    ? <span className="risk-flag"><AlertTriangle size={12} /> {c.rgRisk}</span>
                    : <span className="text-muted">{c.rgRisk}</span>}
                </td>
              </tr>
            ))}
            {topPlayers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  No players in scope.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      <style jsx>{`
        .page-container { max-width: 1400px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
        .page-title { font-size: 28px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px 0; }
        .page-subtitle { font-size: 14px; color: var(--color-text-secondary); margin: 0; }
        .header-actions { display: flex; gap: 12px; }

        .crm-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .kpi { display: flex; align-items: center; gap: 14px; padding: 18px 20px; }
        .kpi-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: var(--color-bg-input); color: var(--color-accent-purple, #a855f7);
        }
        .kpi-label { font-size: 12px; color: var(--color-text-muted); margin: 0 0 2px 0; text-transform: uppercase; }
        .kpi-value { font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin: 0; }

        .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .panel { padding: 20px; }
        .panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .panel-title { font-size: 15px; font-weight: 600; color: var(--color-text-primary); margin: 0; }
        .panel-link { font-size: 12px; color: var(--color-betika-yellow, #F2D641); display: inline-flex; align-items: center; gap: 4px; text-decoration: none; }
        .panel-link:hover { text-decoration: underline; }

        .seg-list { display: flex; flex-direction: column; gap: 10px; }
        .seg-row { display: grid; grid-template-columns: 90px 1fr 40px; align-items: center; gap: 12px; }
        .seg-label { font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .seg-bar-track { height: 8px; border-radius: 4px; background: var(--color-bg-input); overflow: hidden; }
        .seg-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
        .seg-count { font-size: 13px; font-weight: 600; color: var(--color-text-primary); text-align: right; }

        .market-list { display: flex; flex-direction: column; }
        .market-row { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-border); }
        .market-row:last-child { border-bottom: none; }
        .market-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
        .market-meta { font-size: 12px; color: var(--color-text-muted); }
        .market-ltv { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
        .empty { color: var(--color-text-muted); font-size: 13px; }
        .risk-flag { display: inline-flex; align-items: center; gap: 4px; color: #ef4444; font-weight: 600; font-size: 13px; }

        .grid-container { display: flex; flex-direction: column; }

        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th {
          text-align: left; padding: 16px 24px; font-size: 12px; font-weight: 600;
          text-transform: uppercase; color: var(--color-text-muted);
          border-bottom: 1px solid var(--color-border); background: var(--color-bg-input);
        }
        .data-table td { padding: 16px 24px; border-bottom: 1px solid var(--color-border); font-size: 14px; color: var(--color-text-secondary); vertical-align: middle; }
        .data-table tr:hover td { background: var(--color-bg-input); color: var(--color-text-primary); }
        .data-table tr:last-child td { border-bottom: none; }

        .text-mono { font-family: 'Fira Code', monospace; font-size: 12px; }
        .text-muted { color: var(--color-text-muted); }
        .text-secondary { color: var(--color-text-secondary); }
        .text-sm { font-size: 13px; }
        .cell-primary { display: flex; flex-direction: column; }
        .cell-title { color: var(--color-text-primary); font-weight: 600; margin-bottom: 2px; text-decoration: none; }
        .cell-title:hover { color: var(--color-betika-yellow, #F2D641); }
        .cell-subtitle { font-size: 11px; color: var(--color-text-muted); display: flex; align-items: center; gap: 4px; }
        .type-badge { background: var(--color-bg-input); border: 1px solid var(--color-border); padding: 4px 8px; border-radius: 4px; font-size: 11px; color: var(--color-text-primary); font-weight: 500; }

        :global(.crm-new) {
          background: transparent !important; color: var(--color-betika-yellow, #F2D641) !important;
          border: 1px solid var(--color-betika-yellow, #F2D641) !important;
        }
        :global(.crm-new:hover) { background: var(--color-betika-yellow, #F2D641) !important; color: #000 !important; }
        :global(.crm-new .spin) { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }


        @media (max-width: 900px) { .crm-kpis { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .toolbar { flex-direction: column; }
          .search-group { width: 100%; }
          .tabs { width: 100%; overflow-x: auto; }
        }
      `}</style>
    </div>
  );
}

function CrmStatus({ lifecycle }: { lifecycle: PlayerLifecycle }) {
  const meta = LIFECYCLE_META[lifecycle];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
      border: '1px solid currentColor', color: meta.color, background: meta.bg,
    }}>
      {meta.label}
    </span>
  );
}


