'use client';

import { ShieldCheck } from 'lucide-react';
import { MARKETS, formatMoney } from '@/lib/bulk-upload/markets';
import { APPROVAL_THRESHOLDS, AWARD_LABEL, formatExpiry, relativeExpiryLabel, requiresApproval } from '@/lib/bulk-upload/mockBatches';
import type { SubmitInput } from '@/lib/bulk-upload/mockBatches';
import type { ValidationSummary } from '@/lib/bulk-upload/validate';

const fmt = (n: number) => n.toLocaleString('en-GB');

export interface BulkUploadSummaryProps {
  details: SubmitInput['details'];
  summary: ValidationSummary;
}

/** Step 4 — review before confirm: batch details, award/terms/SMS, and what will be submitted. */
export function BulkUploadSummary({ details, summary }: BulkUploadSummaryProps) {
  const market = MARKETS[details.market];
  const submitting = summary.valid + summary.warning;
  const approval = requiresApproval(summary.totalFreebet, submitting);
  const label = AWARD_LABEL[details.awardType];
  const expiryText = details.expiry
    ? `${formatExpiry(details.expiry)}${details.expiry.mode === 'absolute' ? ` (${relativeExpiryLabel(details.expiry.iso)})` : ' after crediting'}`
    : 'No expiry';

  return (
    <div className="bulk-upload__review">
      {approval && (
        <div className="bulk-upload__notice bulk-upload__notice--approval" role="status" data-testid="bulk-approval-notice">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>
            This batch requires approval before awards are released
            <span className="bulk-upload__notice-sub">
              {' '}— thresholds: total over {formatMoney(APPROVAL_THRESHOLDS.totalFreebet, market.currency)} or more than {fmt(APPROVAL_THRESHOLDS.rows)} rows (maker-checker, BR-8).
            </span>
          </span>
        </div>
      )}

      <div className="bulk-upload__review-grid">
        <section className="bulk-upload__review-card" aria-labelledby="bulk-review-batch">
          <h3 id="bulk-review-batch" className="bulk-upload__review-heading">Batch</h3>
          <dl className="bulk-upload__kv">
            <dt>Name</dt><dd data-testid="bulk-review-name">{details.name}</dd>
            <dt>Reference</dt><dd data-testid="bulk-review-reference">{details.reference || '—'}</dd>
            <dt>Market</dt><dd>{market.label} ({market.code})</dd>
            <dt>Currency</dt><dd>{market.currency}</dd>
            <dt>Award type</dt><dd data-testid="bulk-review-award-type">{label}</dd>
            <dt>Expiry</dt><dd data-testid="bulk-review-expiry">{expiryText}</dd>
            {details.description && (<><dt>Description</dt><dd>{details.description}</dd></>)}
          </dl>
        </section>

        <section className="bulk-upload__review-card" aria-labelledby="bulk-review-awards">
          <h3 id="bulk-review-awards" className="bulk-upload__review-heading">Awards</h3>
          <dl className="bulk-upload__kv">
            <dt>Rows to award</dt><dd data-testid="bulk-review-rows">{fmt(submitting)}</dd>
            <dt>Unique customers</dt><dd data-testid="bulk-review-customers">{fmt(summary.uniqueCustomers)}</dd>
            <dt>Total {label}</dt>
            <dd className="bulk-upload__kv-strong" data-testid="bulk-review-total">{formatMoney(summary.totalFreebet, summary.currency)}</dd>
            {summary.totalUnits !== null && (<><dt>Total units</dt><dd data-testid="bulk-review-units">{fmt(summary.totalUnits)}</dd></>)}
            <dt>Errors excluded</dt><dd data-testid="bulk-review-errors">{fmt(summary.error)}</dd>
            <dt>Warnings included</dt><dd data-testid="bulk-review-warnings">{fmt(summary.warning)}</dd>
            {summary.markerRowsSkipped > 0 && (<><dt>Template rows skipped</dt><dd>{fmt(summary.markerRowsSkipped)}</dd></>)}
          </dl>
        </section>

        {details.terms && (
          <section className="bulk-upload__review-card" aria-labelledby="bulk-review-terms">
            <h3 id="bulk-review-terms" className="bulk-upload__review-heading">{label} terms</h3>
            <dl className="bulk-upload__kv" data-testid="bulk-review-terms">
              <dt>Minimum odds</dt><dd data-testid="bulk-review-min-odds">{details.terms.minOdds !== undefined ? details.terms.minOdds.toFixed(2) : '—'}</dd>
              <dt>Maximum win</dt><dd data-testid="bulk-review-max-win">{details.terms.maxWin !== undefined ? formatMoney(details.terms.maxWin, market.currency) : '—'}</dd>
              {details.awardType === 'bonus' && (
                <><dt>Rollover</dt><dd>{details.terms.rolloverMultiplier !== undefined ? `${fmt(details.terms.rolloverMultiplier)}×` : '—'}</dd></>
              )}
            </dl>
          </section>
        )}

        <section className="bulk-upload__review-card" aria-labelledby="bulk-review-sms">
          <h3 id="bulk-review-sms" className="bulk-upload__review-heading">SMS notification</h3>
          <dl className="bulk-upload__kv">
            <dt>Method</dt>
            <dd data-testid="bulk-review-sms-method">{details.sms.method === 'manual' ? `Manual · ${details.sms.owner || '—'}` : 'Automated (mock queue)'}</dd>
            <dt>Recipients</dt><dd>{fmt(submitting)} (one per awarded row)</dd>
            <dt>Message</dt><dd className="bulk-upload__kv-wrap" data-testid="bulk-review-sms-message">{details.sms.message || '—'}</dd>
          </dl>
        </section>
      </div>

      {submitting === 0 && (
        <p className="bulk-upload__hint" data-testid="bulk-review-nothing">
          Nothing to award: the file has no valid or warning rows. Go back and upload a file with data rows.
        </p>
      )}
    </div>
  );
}

export default BulkUploadSummary;
