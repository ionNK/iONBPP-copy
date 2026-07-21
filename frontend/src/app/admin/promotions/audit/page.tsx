'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  History, Search, CheckCircle2, XCircle, MessageSquareWarning, Play,
  Pause, Square, AlertTriangle, Rocket, Pencil, PlusCircle, MessageSquare, Filter, Download,
} from 'lucide-react';

import {
  getAuditEvents, relativeTime, ACTION_LABEL, ACTION_SEVERITY,
  type AuditEvent, type AuditActionType,
} from '@/lib/audit';

const ACTION_ICON: Record<AuditActionType, React.ComponentType<{ size?: number }>> = {
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
    return events.filter((e) => {
      if (filter !== 'all' && e.action !== filter) return false;
      if (!q) return true;
      return (
        e.summary.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        e.targetId.toLowerCase().includes(q) ||
        e.targetName.toLowerCase().includes(q) ||
        e.market.toLowerCase().includes(q) ||
        (e.reason?.toLowerCase().includes(q) ?? false)
      );

    });
  }, [events, query, filter]);

  const exportCsv = () => {
    const headers = ['Timestamp', 'Action', 'Promotion', 'ID', 'Market', 'Actor', 'Role', 'Reason'];
    const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map((e) => [
      new Date(e.timestamp).toISOString(),
      ACTION_LABEL[e.action],
      e.targetName,
      e.targetId,
      e.market,
      e.actor,
      e.actorRole,
      e.reason ?? '',
    ].map(escape).join(','));
    const csv = [headers.map(escape).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="audit">
      <div className="head">
        <div>
          <h1><History size={22} /> Audit Trail</h1>
          <p className="sub">Full record of who changed, approved, launched, paused or stopped every promotion.</p>
        </div>
        <button className="export" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download size={15} /> Export CSV
        </button>
      </div>


      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input
            placeholder="Search by promotion, ID, actor or reason…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="filters">
          <Filter size={14} className="filter-icon" />
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`chip ${filter === f.key ? 'on' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="count">{filtered.length} event{filtered.length === 1 ? '' : 's'}</p>

      <div className="timeline">
        {filtered.map((e) => {
          const Icon = ACTION_ICON[e.action];
          const sev = ACTION_SEVERITY[e.action];
          return (
            <div key={e.id} className="entry">
              <div className={`marker ${sev}`}><Icon size={15} /></div>
              <div className="body">
                <div className="row1">
                  <span className={`tag ${sev}`}>{ACTION_LABEL[e.action]}</span>
                  <b className="target">{e.targetName}</b>
                  <span className="tid">{e.targetId}</span>
                  <span className="market">{e.market}</span>
                  <span className="time">{relativeTime(e.timestamp)}</span>
                </div>
                <div className="row2">
                  <span className="actor">{e.actor}</span>
                  <span className="role">· {e.actorRole}</span>
                </div>
                {e.reason && <div className="reason">“{e.reason}”</div>}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty">No matching audit events.</div>
        )}
      </div>

      <style jsx>{`
        .audit { max-width: 960px; margin: 0 auto; padding-bottom: 40px; }
        .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .head h1 { display: flex; align-items: center; gap: 8px; font-size: 22px; font-weight: 700; margin: 0; color: var(--color-text-primary); }
        .export { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; background: var(--color-bg-input); border: 1px solid var(--color-border); color: var(--color-text-primary); flex-shrink: 0; }
        .export:hover:not(:disabled) { background: var(--color-bg-hover); }
        .export:disabled { opacity: .45; cursor: not-allowed; }

        .sub { color: var(--color-text-muted); font-size: 13px; margin: 6px 0 20px; }
        .toolbar { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
        .search { display: flex; align-items: center; gap: 8px; background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 8px; padding: 9px 12px; color: var(--color-text-muted); }
        .search input { flex: 1; background: transparent; border: none; outline: none; font-size: 13px; color: var(--color-text-primary); }
        .filters { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .filter-icon { color: var(--color-text-muted); margin-right: 4px; }
        .chip { font-size: 12px; padding: 5px 12px; border-radius: 20px; border: 1px solid var(--color-border); background: var(--color-bg-input); color: var(--color-text-muted); cursor: pointer; }
        .chip.on { background: var(--color-betika-yellow); color: #000; border-color: var(--color-betika-yellow); font-weight: 600; }
        .count { font-size: 12px; color: var(--color-text-muted); margin: 0 0 12px; }
        .timeline { display: flex; flex-direction: column; }
        .entry { display: flex; gap: 14px; position: relative; padding-bottom: 18px; }
        .entry:not(:last-child)::before { content: ''; position: absolute; left: 15px; top: 32px; bottom: 0; width: 2px; background: var(--color-border); }
        .marker { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; z-index: 1; }
        .marker.success { background: rgba(105,153,81,.18); color: var(--color-betika-green); }
        .marker.warning { background: rgba(250,204,21,.18); color: #d97706; }
        .marker.error { background: rgba(248,113,113,.18); color: #f87171; }
        .marker.info { background: var(--color-bg-hover); color: #38bdf8; }
        .body { flex: 1; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 10px; padding: 12px 14px; }

        .row1 { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .tag { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 12px; }
        .tag.success { color: var(--color-betika-green); background: rgba(105,153,81,.15); }
        .tag.warning { color: #d97706; background: rgba(250,204,21,.15); }
        .tag.error { color: #f87171; background: rgba(248,113,113,.15); }
        .tag.info { color: #38bdf8; background: rgba(56,189,248,.15); }
        .target { font-size: 14px; color: var(--color-text-primary); }
        .tid { font-family: monospace; font-size: 11px; color: var(--color-text-muted); }
        .market { font-size: 11px; color: var(--color-text-muted); background: var(--color-bg-hover); padding: 1px 8px; border-radius: 10px; }
        .time { margin-left: auto; font-size: 11px; color: var(--color-text-muted); }
        .row2 { margin-top: 4px; font-size: 12px; }
        .actor { color: var(--color-text-primary); font-weight: 600; }
        .role { color: var(--color-text-muted); }
        .reason { margin-top: 8px; font-size: 12px; color: var(--color-text-secondary); font-style: italic; border-left: 2px solid var(--color-border); padding-left: 10px; }
        .empty { text-align: center; padding: 40px; color: var(--color-text-muted); font-size: 13px; }
      `}</style>
    </div>
  );
}
