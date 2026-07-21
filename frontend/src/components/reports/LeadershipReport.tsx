'use client';

// Leadership Report (RP-002) — a plain-language, aggregated summary across all
// in-scope promotions: reach, participation, cost and efficiency. No jargon,
// no per-customer data. CSV export.

import { Download, Users, Award, Wallet, Target } from 'lucide-react';
import { getPromotionReports, formatCurrency, exportCsv } from '@/lib/reportingMetrics';
import { useCountry } from '@/context/CountryContext';

export default function LeadershipReport() {
  const { isInScope } = useCountry();
  const reports = getPromotionReports().filter((r) => isInScope(r.market));

  // Aggregate. Currencies may differ across markets, so we keep value totals
  // per-currency but present count-based headline numbers as a single figure.
  const totalEligible = reports.reduce((s, r) => s + r.metrics.eligible, 0);
  const totalQualified = reports.reduce((s, r) => s + r.metrics.qualified, 0);
  const totalAwarded = reports.reduce((s, r) => s + r.metrics.awardedCount, 0);
  const totalUsed = reports.reduce((s, r) => s + r.metrics.usedCount, 0);
  const participationRate = totalEligible ? Math.round((totalQualified / totalEligible) * 100) : 0;
  const usageRate = totalAwarded ? Math.round((totalUsed / totalAwarded) * 100) : 0;

  const costByCurrency = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.currency] = (acc[r.currency] ?? 0) + r.metrics.budgetUsed;
    return acc;
  }, {});

  const handleExport = () => {
    const rows = reports.map((r) => ({
      Promotion: r.name,
      Market: r.market,
      State: r.state,
      Eligible: r.metrics.eligible,
      Qualified: r.metrics.qualified,
      Awarded: r.metrics.awardedCount,
      Used: r.metrics.usedCount,
      Currency: r.currency,
      Spend: r.metrics.budgetUsed,
    }));
    exportCsv('leadership-summary', rows);
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Plain-language summary across {reports.length} in-scope promotion{reports.length === 1 ? '' : 's'}.
        </div>
        <button onClick={handleExport} style={btnStyle}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Headline KPIs. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <Kpi icon={<Users size={18} />} label="Customers Reached" value={totalEligible.toLocaleString()}
          sub={`${totalQualified.toLocaleString()} took part`} />
        <Kpi icon={<Target size={18} />} label="Participation Rate" value={`${participationRate}%`}
          sub="of eligible customers qualified" />
        <Kpi icon={<Award size={18} />} label="Rewards Given" value={totalAwarded.toLocaleString()}
          sub={`${usageRate}% were used`} />
        <Kpi icon={<Wallet size={18} />} label="Total Spend" value={Object.entries(costByCurrency)
          .map(([c, v]) => formatCurrency(v, c)).join(' · ')}
          sub="promotional value used" />
      </div>

      {/* Per-promotion plain-language rundown. */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>How each promotion performed</div>
        <div style={{ display: 'grid', gap: 12 }}>
          {reports.map((r) => {
            const part = r.metrics.eligible ? Math.round((r.metrics.qualified / r.metrics.eligible) * 100) : 0;
            return (
              <div key={r.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontWeight: 600 }}>{r.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>· {r.market}</span></div>
                <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>
                  Reached <strong>{r.metrics.eligible.toLocaleString()}</strong> customers, of whom{' '}
                  <strong>{r.metrics.qualified.toLocaleString()}</strong> took part ({part}%). We gave out{' '}
                  <strong>{r.metrics.awardedCount.toLocaleString()}</strong> rewards worth{' '}
                  <strong>{formatCurrency(r.metrics.awardedValue, r.currency)}</strong>, spending{' '}
                  <strong>{formatCurrency(r.metrics.budgetUsed, r.currency)}</strong> so far.
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface)',
};
const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
  border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)',
  cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
