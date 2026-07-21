'use client';

// Compliance Report (RP-002, RP-004, RP-006) — configuration & decisions
// (from the audit trail) plus grouped block-reason categories (no sensitive
// per-customer detail). CSV export.

import { Download, Shield } from 'lucide-react';
import { getAuditEvents, ACTION_LABEL, relativeTime } from '@/lib/audit';
import { getPromotionReports, exportCsv } from '@/lib/reportingMetrics';
import { useCountry } from '@/context/CountryContext';

export default function ComplianceReport() {
  const { isInScope } = useCountry();
  const reports = getPromotionReports().filter((r) => isInScope(r.market));
  const events = getAuditEvents().filter((e) => isInScope(e.market));

  const handleExport = () => {
    const rows = events.map((e) => ({
      Timestamp: e.timestamp,
      Action: ACTION_LABEL[e.action],
      Promotion: e.targetName,
      Market: e.market,
      Actor: e.actor,
      Role: e.actorRole,
      Reason: e.reason ?? '',
    }));
    exportCsv('compliance-report', rows);
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <Shield size={18} /> Configuration & Decisions
        </div>
        <button onClick={handleExport} style={btnStyle}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Decisions & config changes from the audit trail. */}
      <div style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={thStyle}>When</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Promotion</th>
                <th style={thStyle}>Actor</th>
                <th style={thStyle}>Reason / Comment</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={tdStyle}>{relativeTime(e.timestamp)}</td>
                  <td style={tdStyle}>{ACTION_LABEL[e.action]}</td>
                  <td style={tdStyle}>{e.targetName}</td>
                  <td style={tdStyle}>{e.actor} <span style={{ color: 'var(--text-muted)' }}>({e.actorRole})</span></td>
                  <td style={tdStyle}>{e.reason ?? '—'}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>No decisions recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grouped block reasons (RP-006). */}
      <div>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Blocked Customers by Reason Category</div>
        <div style={{ display: 'grid', gap: 16 }}>
          {reports.map((r) => {
            const total = r.blockReasons.reduce((s, b) => s + b.count, 0);
            return (
              <div key={r.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total.toLocaleString()} blocked</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  {r.blockReasons.map((b) => (
                    <div key={b.category} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.category}</div>
                      <div style={{ fontWeight: 600 }}>{b.count.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)',
};
const thStyle: React.CSSProperties = { padding: '6px 8px', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '8px' };
const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
  border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)',
  cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
