'use client';

import T from '@/theme/tokens';
import { Badge } from '@/components/ui';
import { promotionName } from '@/lib/experiments/mockExperiments';
import type { ExperimentResults } from '@/lib/experiments/mockExperiments';

const pct = (value: number) => `${value.toFixed(1)}%`;
const signedPct = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
const count = (value: number) => value.toLocaleString('en-GB');

const HEADINGS = ['Group', 'Players', 'Qualified', 'Awarded', 'Repeat rate 7d', 'Retention 30d', 'Lift vs holdout', 'Confidence'];

/** Counts and rates only — no award values or currency in experiment results. */
export function ExperimentResultsTable({ results }: { results: ExperimentResults }) {
  const { holdout } = results;
  return (
    <div className="promo-table-scroll">
      <table className="promo-table promo-experiments__results" data-testid="experiment-results">
        <thead>
          <tr>
            {HEADINGS.map((heading) => (
              <th key={heading} style={{ color: T.textSecondary, borderBottom: `1px solid ${T.border}` }}>{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.arms.map((arm) => (
            <tr key={arm.promoId} data-testid="experiment-result-arm" style={{ borderBottom: `1px solid ${T.border}` }}>
              <td className="promo-cell" style={{ color: T.textPrimary }}>{promotionName(arm.promoId)}</td>
              <td className="promo-cell">{count(arm.players)}</td>
              <td className="promo-cell">{count(arm.qualified)}</td>
              <td className="promo-cell">{count(arm.awarded)}</td>
              <td className="promo-cell">{pct(arm.repeatRate7d)}</td>
              <td className="promo-cell">{pct(arm.retention30d)}</td>
              <td className="promo-cell" style={{ color: arm.liftVsHoldout >= 0 ? T.success : T.destructive }}>{signedPct(arm.liftVsHoldout)}</td>
              <td><Badge color={T.navy} ghost>{arm.confidence}</Badge></td>
            </tr>
          ))}
          <tr data-testid="experiment-result-holdout">
            <td className="promo-cell" style={{ color: T.textPrimary }}>Holdout</td>
            <td className="promo-cell">{count(holdout.players)}</td>
            <td className="promo-cell">{count(holdout.qualified)}</td>
            <td className="promo-cell">{count(holdout.awarded)}</td>
            <td className="promo-cell">{pct(holdout.repeatRate7d)}</td>
            <td className="promo-cell">{pct(holdout.retention30d)}</td>
            <td className="promo-cell" style={{ color: T.textSecondary }}>Baseline</td>
            <td className="promo-cell" style={{ color: T.textSecondary }}>·</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ExperimentResultsTable;
