'use client';

import { useEffect, useMemo, useState } from 'react';
import {
 History,
 Search,
 CheckCircle2,
 XCircle,
 MessageSquareWarning,
 Play,
 Pause,
 Square,
 AlertTriangle,
 Rocket,
 Pencil,
 PlusCircle,
 MessageSquare,
 Filter,
 Download,
} from 'lucide-react';

import {
 getAuditEvents,
 relativeTime,
 ACTION_LABEL,
 ACTION_SEVERITY,
 type AuditEvent,
 type AuditActionType,
} from '@/lib/audit';

const ACTION_ICON: Record<
 AuditActionType,
 React.ComponentType<{ size?: number }>
> = {
 approve: CheckCircle2,
 reject: XCircle,
 request_changes: MessageSquareWarning,
 create: PlusCircle,
 edit: Pencil,
 launch: Rocket,
 pause: Pause,
 resume: Play,
 end: Square,
 emergency_stop: AlertTriangle,
 comment: MessageSquare,
};

const FILTERS: { key: 'all' | AuditActionType; label: string }[] = [
 { key: 'all', label: 'All' },
 { key: 'approve', label: 'Approvals' },
 { key: 'reject', label: 'Rejections' },
 { key: 'request_changes', label: 'Change Requests' },
 { key: 'launch', label: 'Launches' },
 { key: 'pause', label: 'Pauses' },
 { key: 'resume', label: 'Resumes' },
 { key: 'end', label: 'Ends' },
 { key: 'emergency_stop', label: 'Emergency Stops' },
 { key: 'edit', label: 'Edits' },
];

export default function AuditPage() {
 const [events, setEvents] = useState<AuditEvent[]>([]);
 const [query, setQuery] = useState('');
 const [filter, setFilter] = useState<'all' | AuditActionType>('all');

 useEffect(() => {
 const load = () => setEvents(getAuditEvents());
 load();
 window.addEventListener('audit-trail-updated', load);
 window.addEventListener('storage', load);
 return () => {
 window.removeEventListener('audit-trail-updated', load);
 window.removeEventListener('storage', load);
 };
 }, []);

 const filtered = useMemo(() => {
 const q = query.trim().toLowerCase();
 return events.filter((event) => {
 if (filter !== 'all' && event.action !== filter) return false;
 if (!q) return true;

 return (
 event.summary.toLowerCase().includes(q) ||
 event.actor.toLowerCase().includes(q) ||
 event.targetId.toLowerCase().includes(q) ||
 event.targetName.toLowerCase().includes(q) ||
 event.market.toLowerCase().includes(q) ||
 (event.reason?.toLowerCase().includes(q) ?? false)
 );
 });
 }, [events, query, filter]);

 const exportCsv = () => {
 const headers = [
 'Timestamp',
 'Action',
 'Promotion',
 'ID',
 'Market',
 'Actor',
 'Role',
 'Reason',
 ];
 const escape = (value: string) => `"${(value ?? '').replace(/"/g, '""')}"`;
 const rows = filtered.map((event) =>
 [
 new Date(event.timestamp).toISOString(),
 ACTION_LABEL[event.action],
 event.targetName,
 event.targetId,
 event.market,
 event.actor,
 event.actorRole,
 event.reason ?? '',
 ]
 .map(escape)
 .join(','),
 );
 const csv = [headers.map(escape).join(','), ...rows].join('\n');
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
 link.click();
 URL.revokeObjectURL(url);
 };

 return (
 <div className="promotion-audit-page">
 <div className="promotion-audit-page__header">
 <div>
 <h1 className="promotion-audit-page__title">
 <History size={22} /> Audit Trail
 </h1>
 <p className="promotion-audit-page__subtitle">
 Full record of who changed, approved, launched, paused or stopped every
 promotion.
 </p>
 </div>
 <button
 className="promotion-audit-page__export"
 onClick={exportCsv}
 disabled={filtered.length === 0}
 >
 <Download size={15} /> Export CSV
 </button>
 </div>

 <div className="promotion-audit-page__toolbar">
 <div className="promotion-audit-page__search">
 <Search size={16} />
 <input
 placeholder="Search by promotion, ID, actor or reason…"
 value={query}
 onChange={(event) => setQuery(event.target.value)}
 />
 </div>
 <div className="promotion-audit-page__filters">
 <Filter size={14} className="promotion-audit-page__filter-icon" />
 {FILTERS.map((item) => (
 <button
 key={item.key}
 className={`promotion-audit-page__chip ${
 filter === item.key ? 'is-active' : ''
 }`}
 onClick={() => setFilter(item.key)}
 >
 {item.label}
 </button>
 ))}
 </div>
 </div>

 <p className="promotion-audit-page__count">
 {filtered.length} event{filtered.length === 1 ? '' : 's'}
 </p>

 <div className="promotion-audit-page__timeline">
 {filtered.map((event) => {
 const Icon = ACTION_ICON[event.action];
 const severity = ACTION_SEVERITY[event.action];

 return (
 <div key={event.id} className="promotion-audit-page__entry">
 <div className={`promotion-audit-page__marker ${severity}`}>
 <Icon size={15} />
 </div>
 <div className="promotion-audit-page__body">
 <div className="promotion-audit-page__primary-row">
 <span className={`promotion-audit-page__tag ${severity}`}>
 {ACTION_LABEL[event.action]}
 </span>
 <b className="promotion-audit-page__target">{event.targetName}</b>
 <span className="promotion-audit-page__id">{event.targetId}</span>
 <span className="promotion-audit-page__market">{event.market}</span>
 <span className="promotion-audit-page__time">
 {relativeTime(event.timestamp)}
 </span>
 </div>
 <div className="promotion-audit-page__actor-row">
 <span className="promotion-audit-page__actor">{event.actor}</span>
 <span className="promotion-audit-page__role">
 · {event.actorRole}
 </span>
 </div>
 {event.reason && (
 <div className="promotion-audit-page__reason">
 “{event.reason}”
 </div>
 )}
 </div>
 </div>
 );
 })}
 {filtered.length === 0 && (
 <div className="promotion-audit-page__empty">
 No matching audit events.
 </div>
 )}
 </div>
 </div>
 );
}