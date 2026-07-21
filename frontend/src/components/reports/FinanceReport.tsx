'use client';

// Finance Report (RP-003, RP-005, RP-007) — awarded / outstanding / used /
// expired / final values per promotion and per reward type, with budget
// tracking and a finalisation section for ended/archived promotions. CSV export.

import { Download, CheckCircle2 } from 'lucide-react';
import {
  getPromotionReports, budgetPct, formatCurrency, exportCsv,
} from '@/lib/reportingMetrics';
import { useCountry } from '@/context/CountryContext';

export default function FinanceReport() {
  const { isInScope } = useCountry();
  const reports = getPromotionReports().filter((r) => isInScope(r.market));

  const handleExport = () => {
    const rows = reports.flatMap((r) =>
      r.rewardTypes.map((rt) => ({
        Promotion: r.name,
        Market: r.market,
        State: r.state,
        Currency: r.currency,
        RewardType: rt.rewardType,
        Awarded: rt.awardedValue,
        Outstanding: rt.outstandingValue,
        Used: rt.usedValue,
        Expired: rt.expiredValue,
        FinalCost: rt.finalCost,
      }))
    );
    exportCsv('finance-report', rows);
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleExport} style={btnStyle}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {reports.map((r) => {
        const pct = budgetPct(r);
        const finalised = r.state === 'ended' || r.state === 'archived';
        return (
          <div key={r.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.market} · {r.id} · {r.state}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13 }}>
                <div style={{ color: 'var(--text-muted)' }}>Budget Used</div>
                <div style={{ fontWeight: 600 }}>
                  {formatCurrency(r.metrics.budgetUsed, r.currency)} / {formatCurrency(r.budgetCap, r.currency)} ({pct}%)
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={thStyle}>Reward Type</th>
                    <th style={thStyle}>Awarded</th>
                    <th style={thStyle}>Outstanding</th>
                    <th style={thStyle}>Used</th>
                    <th style={thStyle}>Expired</th>
                    {finalised && <th style={thStyle}>Final Cost</th>}
                  </tr>
                </thead>
                <tbody>
                  {r.rewardTypes.map((rt) => (
                    <tr key={rt.rewardType} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={tdStyle}>{rt.rewardType}</td>
                      <td style={tdStyle}>{formatCurrency(rt.awardedValue, r.currency)}</td>
                      <td style={tdStyle}>{formatCurrency(rt.outstandingValue, r.currency)}</td>
                      <td style={tdStyle}>{formatCurrency(rt.usedValue, r.currency)}</td>
                      <td style={tdStyle}>{formatCurrency(rt.expiredValue, r.currency)}</td>
                      {finalised && <td style={tdStyle}>{formatCurrency(rt.finalCost, r.currency)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {finalised ? (
              <div style={{
                marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#dcfce7', color: '#15803d', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              }}>
                <CheckCircle2 size={16} /> Finalised — settled cost {formatCurrency(r.metrics.finalCost, r.currency)}
              </div>
            ) : (
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                Outstanding exposure: {formatCurrency(r.metrics.outstandingExposure, r.currency)} — final cost pending settlement.
              </div>
            )}
          </div>
        );
      })}
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
