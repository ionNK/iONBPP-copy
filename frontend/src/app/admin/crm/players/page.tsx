'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { DollarSign, Mail, Phone, RefreshCw, Search, TrendingUp, Users } from 'lucide-react';
import { Player, PlayerLifecycle, getLastSync, getPlayers, LIFECYCLE_META, resyncPlayers, timeAgo, formatCurrency } from '@/data/players';
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
   setSyncToast(newEvents > 0 ? `Ingested ${newEvents} new event${newEvents > 1 ? 's' : ''} from the platform.` : 'Sync complete — no new activity since last sync.');
   setTimeout(() => setSyncToast(null), 4000);
  }, 900);
 };

 const scoped = players.filter((player) => isInScope(player.country));
 const filtered = scoped.filter((player) => {
  const matchesSegment = segment === 'all' || player.lifecycle === segment;
  const normalizedQuery = query.toLowerCase();
  const matchesQuery = !normalizedQuery || player.name.toLowerCase().includes(normalizedQuery) || player.email.toLowerCase().includes(normalizedQuery) || player.id.toLowerCase().includes(normalizedQuery);
  return matchesSegment && matchesQuery;
 });
 const totalLtv = scoped.reduce((sum, player) => sum + player.ltv, 0);
 const activeCount = scoped.filter((player) => ['active', 'vip', 'reactivated'].includes(player.lifecycle)).length;
 const atRiskCount = scoped.filter((player) => player.lifecycle === 'at_risk' || player.rgRisk >= 60).length;

 return (
  <div className="crm-players-page ds-page-shell">
   <div className="page-header">
    <div>
     <h1 className="page-title">Player 360</h1>
     <p className="page-subtitle">Search & drill into individual player profiles. {' · '}{selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'All markets'}{lastSync ? ` · last sync ${timeAgo(lastSync)}` : ' · not yet synced'}.</p>
    </div>
    <div className="header-actions"><button className="btn btn-primary crm-new" onClick={handleSync} disabled={syncing}><RefreshCw size={18} className={syncing ? 'spin' : ''} /> {syncing ? 'Syncing…' : 'Sync from Platform'}</button></div>
   </div>
   {syncToast && <div className="sync-toast">{syncToast}</div>}
   <div className="crm-kpis">
    <Kpi icon={<Users size={20} />} label="Total Players" value={scoped.length} />
    <Kpi icon={<TrendingUp size={20} />} label="Active / VIP" value={activeCount} />
    <Kpi icon={<Users size={20} />} iconClassName="kpi-icon--risk" label="At Risk" value={atRiskCount} />
    <Kpi icon={<DollarSign size={20} />} label="Total LTV (indexed)" value={totalLtv.toLocaleString()} />
   </div>
   <div className="toolbar glass-panel">
    <div className="search-group"><Search size={18} className="search-icon" /><input type="text" placeholder="Search customers..." className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    <div className="tabs">{FILTERS.map((filter) => <button key={filter} className={`tab ${segment === filter ? 'active' : ''}`} onClick={() => setSegment(filter)}>{filter === 'all' ? 'All' : LIFECYCLE_META[filter].label}</button>)}</div>
   </div>
   <div className="grid-container glass-panel">
    <table className="data-table">
     <thead><tr><th className="crm-players-page__id-column">Player ID</th><th>Player</th><th>Product</th><th>Lifecycle</th><th>Lifetime Value</th><th>Last Active</th></tr></thead>
     <tbody>
      {filtered.map((player) => <tr key={player.id}><td className="text-mono text-muted">{player.id}</td><td><div className="cell-primary"><Link href={`/admin/crm/${player.id}`} className="cell-title hover-link">{player.name}</Link><span className="cell-subtitle"><Mail size={10} /> {player.email} &nbsp; <Phone size={10} /> {player.phone}</span></div></td><td><span className="type-badge">{player.primaryProduct}</span></td><td><CrmStatus lifecycle={player.lifecycle} /></td><td className="text-secondary">{formatCurrency(player.ltv, player.currency)}</td><td className="text-secondary text-sm">{timeAgo(player.lastActiveAt)}</td></tr>)}
      {filtered.length === 0 && <tr><td colSpan={6} className="crm-players-page__empty-cell">No customers match your filters.</td></tr>}
     </tbody>
    </table>
   </div>
  </div>
 );
}

function Kpi({ icon, iconClassName = '', label, value }: { icon: ReactNode; iconClassName?: string; label: string; value: ReactNode }) {
 return <div className="kpi glass-panel"><div className={`kpi-icon ${iconClassName}`}>{icon}</div><div><p className="kpi-label">{label}</p><p className="kpi-value">{value}</p></div></div>;
}

function CrmStatus({ lifecycle }: { lifecycle: PlayerLifecycle }) {
 const meta = LIFECYCLE_META[lifecycle];
 return <span className="crm-players-page__lifecycle-status" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>;
}
