'use client';

// Operations Health (RP-001) — surfaces award-failure rate, abnormal volume,
// and budget-near-exhaustion so ops can act (recommend / trigger pause).

import { AlertTriangle, Activity, CheckCircle2, TrendingUp } from 'lucide-react';
import {
  getPromotionReports, budgetPct, isBudgetExhausted, formatCurrency,
} from '@/lib/reportingMetrics';
import { useCountry } from '@/context/CountryContext';

export default function OperationsHealth() {
  const { isInScope } = useCountry();
  const reports = getPromotionReports().filter((r) => isInScope(r.market));

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {reports.map((r) => {
        const pct = budgetPct(r);
        const failurePct = (r.awardFailureRate * 100).toFixed(2);
        const highFailure = r.awardFailureRate > 0.01;
        const nearBudget = pct >= 80;
        const exhausted = isBudgetExhausted(r);
        const recommendPause = highFailure || r.volumeAnomaly || exhausted;

        return (
          <div key={r.id} style={{
            border: '1px solid var(--border)', borderRadius: 12, padding: 16,
            background: 'var(--surface)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.market} · {r.id}</div>
              </div>
              {recommendPause ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                  color: '#b91c1c', background: '#fee2e2', padding: '4px 10px', borderRadius: 999,
                }}>
                  <AlertTriangle size={14} /> Recommend Pause
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                  color: '#15803d', background: '#dcfce7', padding: '4px 10px', borderRadius: 999,
                }}>
                  <CheckCircle2 size={14} /> Healthy
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <Signal
                icon={<Activity size={16} />}
                label="Award Failure Rate"
                value={`${failurePct}%`}
                bad={highFailure}
              />
              <Signal
                icon={<TrendingUp size={16} />}
                label="Volume"
                value={r.volumeAnomaly ? 'Abnormal spike' : 'Normal'}
                bad={r.volumeAnomaly}
              />
              <Signal
                icon={<AlertTriangle size={16} />}
                label="Budget Used"
                value={`${pct}%`}
                bad={nearBudget}
              />
              <Signal
                icon={<Activity size={16} />}
                label="Remaining"
                value={formatCurrency(r.metrics.budgetRemaining, r.currency)}
                bad={exhausted}
              />
            </div>

            {recommendPause && (
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                Use the operational controls on the promotion detail or monitor page to pause with a mandatory reason.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Signal({ icon, label, value, bad }: { icon: React.ReactNode; label: string; value: string; bad: boolean }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 10, padding: 12,
      background: bad ? '#fef2f2' : 'var(--bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
        {icon} {label}
      </div>
      <div style={{ fontWeight: 600, color: bad ? '#b91c1c' : 'var(--text)' }}>{value}</div>
    </div>
  );
}
