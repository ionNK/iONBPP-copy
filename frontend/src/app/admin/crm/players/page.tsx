'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Mail, Phone, TrendingUp, DollarSign } from 'lucide-react';
import {
  Player,
  PlayerLifecycle,
  getPlayers,
  resyncPlayers,
  getLastSync,
  timeAgo,
  formatCurrency,
  LIFECYCLE_META,
} from '@/data/players';
import { useCountry } from '@/context/CountryContext';


const FILTERS: (PlayerLifecycle | 'all')[] = ['all', 'vip', 'active', 'new', 'reactivated', 'at_risk', 'dormant', 'churned'];

export default function Player360DirectoryPage() {

  const { isInScope, selectedCountry } = useCountry();
  const [players, setPlayers] = useState<Player[]>([]);
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<PlayerLifecycle | 'all'>('all');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);


  useEffect(() => {
    setPlayers(getPlayers());
    setLastSync(getLastSync());
  }, []);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      const { players: fresh, syncedAt, newEvents } = resyncPlayers();
      setPlayers([...fresh]);
      setLastSync(syncedAt);
      setSyncing(false);
      setSyncToast(
        newEvents > 0
          ? `Ingested ${newEvents} new event${newEvents > 1 ? 's' : ''} from the platform.`
          : 'Sync complete — no new activity since last sync.'
      );
      setTimeout(() => setSyncToast(null), 4000);
    }, 900);
  };


  // Scope all data to the market(s) the current admin can access.
  const scoped = players.filter((p) => isInScope(p.country));

  const filtered = scoped.filter((p) => {
    const matchesSegment = segment === 'all' || p.lifecycle === segment;
    const q = query.toLowerCase();
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    return matchesSegment && matchesQuery;
  });

  const totalLtv = scoped.reduce((sum, p) => sum + p.ltv, 0);
  const activeCount = scoped.filter((p) => ['active', 'vip', 'reactivated'].includes(p.lifecycle)).length;
  const atRiskCount = scoped.filter((p) => p.lifecycle === 'at_risk' || p.rgRisk >= 60).length;



  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Player 360</h1>
          <p className="page-subtitle">
            Search & drill into individual player profiles.
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

      {syncToast && <div className="sync-toast">{syncToast}</div>}



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

      {/* Toolbar */}
      <div className="toolbar glass-panel">
        <div className="search-group">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search customers..."
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
          <div className="tabs">
            {FILTERS.map((s) => (
              <button
                key={s}
                className={`tab ${segment === s ? 'active' : ''}`}
                onClick={() => setSegment(s)}
              >
                {s === 'all' ? 'All' : LIFECYCLE_META[s].label}
              </button>
            ))}
          </div>

      </div>

      {/* Table */}
      <div className="grid-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
                <th style={{ width: '120px' }}>Player ID</th>
                <th>Player</th>
                <th>Product</th>
                <th>Lifecycle</th>
                <th>Lifetime Value</th>
                <th>Last Active</th>

            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="text-mono text-muted">{c.id}</td>
                <td>
                  <div className="cell-primary">
                    <Link href={`/admin/crm/${c.id}`} className="cell-title hover-link">{c.name}</Link>
                    <span className="cell-subtitle">
                      <Mail size={10} /> {c.email} &nbsp; <Phone size={10} /> {c.phone}
                    </span>
                  </div>
                </td>
                  <td><span className="type-badge">{c.primaryProduct}</span></td>
                  <td><CrmStatus lifecycle={c.lifecycle} /></td>
                  <td className="text-secondary">{formatCurrency(c.ltv, c.currency)}</td>
                  <td className="text-secondary text-sm">{timeAgo(c.lastActiveAt)}</td>

              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  No customers match your filters.
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

        .sync-toast {
          margin-bottom: 20px; padding: 12px 16px; border-radius: 8px;
          font-size: 13px; font-weight: 500; color: var(--color-text-primary);
          background: rgba(105, 153, 81, 0.12); border: 1px solid rgba(105, 153, 81, 0.4);
          animation: toastIn 0.25s ease;
        }
        @keyframes toastIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }


        .crm-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .kpi { display: flex; align-items: center; gap: 14px; padding: 18px 20px; }
        .kpi-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: var(--color-bg-input); color: var(--color-accent-purple, #a855f7);
        }
        .kpi-label { font-size: 12px; color: var(--color-text-muted); margin: 0 0 2px 0; text-transform: uppercase; }
        .kpi-value { font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin: 0; }

        .toolbar { display: flex; justify-content: space-between; padding: 16px; margin-bottom: 24px; gap: 16px; }
        .search-group {
          position: relative; width: 320px; display: flex; align-items: center; gap: 12px;
          background: var(--color-bg-input); border: 1px solid var(--color-border);
          border-radius: 8px; padding: 8px 12px;
        }
        .search-icon { color: var(--color-text-muted); flex-shrink: 0; }
        .search-input { flex: 1; background: transparent; border: none; color: var(--color-text-primary); outline: none; font-size: 14px; }
        .search-input::placeholder { color: var(--color-text-muted); }

        .tabs { display: flex; background: var(--color-bg-input); padding: 4px; border-radius: 8px; border: 1px solid var(--color-border); }
        .tab { background: transparent; border: none; color: var(--color-text-secondary); padding: 6px 14px; font-size: 13px; font-weight: 500; cursor: pointer; border-radius: 6px; }
        .tab.active { background: var(--color-bg-panel); color: var(--color-text-primary); box-shadow: var(--shadow-sm); }

        .grid-container { display: flex; flex-direction: column; min-height: 300px; }
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


