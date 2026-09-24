'use client';

import { useMemo } from 'react';
import { CheckCircle2, Clock, Download, MessageSquare, XCircle } from 'lucide-react';
import { Badge, GhostButton, PrimaryButton } from '@/components/ui';
import T from '@/theme/tokens';
import { MARKETS, formatMoney } from '@/lib/bulk-upload/markets';
import { AWARD_LABEL, formatExpiry } from '@/lib/bulk-upload/mockBatches';
import type { Batch, BatchStatus } from '@/lib/bulk-upload/mockBatches';

const fmt = (n: number) => n.toLocaleString('en-GB');

/** Data rows in a CSV string (header excluded). */
const csvRowCount = (csv: string) => Math.max(0, csv.split(/\r\n|\n/).filter((l) => l.trim() !== '').length - 1);

/**
 * Download href for a CSV string. A data: URL needs no revoke lifecycle — a
 * blob URL memoised alongside a revoking effect is revoked by StrictMode's
 * double effect run in development, leaving a dead link.
 */
const csvHref = (csv: string) => `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

export const STATUS_LABEL: Record<BatchStatus, string> = {
  awarded: 'Awarded',
  pending_approval: 'Pending approval',
  rejected: 'Rejected',
};

/** Status pill: Awarded=success (solid), Pending approval=navy ghost (house style), Rejected=destructive. */
export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  if (status === 'pending_approval') return <Badge color={T.navy} ghost>{STATUS_LABEL[status]}</Badge>;
  return <Badge color={status === 'awarded' ? T.success : T.destructive}>{STATUS_LABEL[status]}</Badge>;
}

/** Number of reject rows in the batch's rejects CSV (header excluded). */
export const rejectRowCount = (batch: Batch) => csvRowCount(batch.rejectsCsv);
/** Number of SMS recipients in the batch's recipient list (header excluded). */
export const recipientRowCount = (batch: Batch) => csvRowCount(batch.sms.recipientsCsv);

export interface BulkUploadResultProps {
  batch: Batch;
  /** Stepper mode: shows the "View in history" / "Start another" actions. */
  onViewHistory?: () => void;
  onStartAnother?: () => void;
  /** Compact mode inside the history expander. */
  compact?: boolean;
}

/** Step 5 / history detail — outcome of a submitted batch with the rejects CSV download (Blob link). */
export function BulkUploadResult({ batch, onViewHistory, onStartAnother, compact }: BulkUploadResultProps) {
  const market = MARKETS[batch.market];
  const rejects = rejectRowCount(batch);
  const recipients = recipientRowCount(batch);
  const label = AWARD_LABEL[batch.awardType];

  const href = useMemo(() => csvHref(batch.rejectsCsv), [batch.rejectsCsv]);
  const recipientsHref = useMemo(() => csvHref(batch.sms.recipientsCsv), [batch.sms.recipientsCsv]);

  const Icon = batch.status === 'awarded' ? CheckCircle2 : batch.status === 'pending_approval' ? Clock : XCircle;

  /* SMS status is mocked: automated batches are "queued" once awarded; manual batches wait on the named owner. */
  const smsStatus = batch.status !== 'awarded'
    ? 'Not sent — awaiting batch approval'
    : batch.sms.method === 'automated'
      ? `Queued for ${fmt(recipients)} recipient${recipients === 1 ? '' : 's'} (mock)`
      : `Manual — ${batch.sms.owner || 'owner'} to send to ${fmt(recipients)} recipient${recipients === 1 ? '' : 's'}`;

  return (
    <div className={`bulk-upload__result${compact ? ' bulk-upload__result--compact' : ''}`} data-testid="bulk-result">
      <div className="bulk-upload__result-head">
        <span className={`bulk-upload__result-icon bulk-upload__result-icon--${batch.status}`} aria-hidden="true">
          <Icon size={20} />
        </span>
        <div className="bulk-upload__result-title-wrap">
          <p className="bulk-upload__result-title">
            {batch.status === 'awarded' && `${fmt(batch.accepted)} ${label} award${batch.accepted === 1 ? '' : 's'} credited`}
            {batch.status === 'pending_approval' && 'Submitted for approval'}
            {batch.status === 'rejected' && 'Batch rejected'}
          </p>
          <p className="bulk-upload__result-sub" data-testid="bulk-result-sub">
            {batch.name}{batch.reference ? ` · ${batch.reference}` : ''} · {market.code} · {label}
            {batch.expiry ? ` · expiry ${formatExpiry(batch.expiry)}` : ' · no expiry'}
          </p>
        </div>
        <span data-testid="bulk-result-status" data-status={batch.status}>
          <BatchStatusBadge status={batch.status} />
        </span>
      </div>

      <dl className="bulk-upload__summary">
        <div className="bulk-upload__stat bulk-upload__stat--valid">
          <dt>Accepted</dt>
          <dd data-testid="bulk-result-accepted">{fmt(batch.accepted)}</dd>
        </div>
        <div className="bulk-upload__stat bulk-upload__stat--error">
          <dt>Rejected</dt>
          <dd data-testid="bulk-result-rejected">{fmt(batch.rejected)}</dd>
        </div>
        <div className="bulk-upload__stat">
          <dt>Rows submitted</dt>
          <dd>{fmt(batch.rowCount)}</dd>
        </div>
        <div className="bulk-upload__stat">
          <dt>Total {label}</dt>
          <dd data-testid="bulk-result-total">{formatMoney(batch.totalFreebet, batch.currency)}</dd>
        </div>
        {batch.totalUnits !== null && (
          <div className="bulk-upload__stat">
            <dt>Total units</dt>
            <dd data-testid="bulk-result-units">{fmt(batch.totalUnits)}</dd>
          </div>
        )}
      </dl>

      {batch.status === 'pending_approval' && (
        <p className="bulk-upload__hint">
          Awards are held until a checker approves this batch in Approvals. Nothing has been credited yet.
        </p>
      )}

      <div className="bulk-upload__notice" role="status" data-testid="bulk-result-sms" data-sms-method={batch.sms.method}>
        <MessageSquare size={16} aria-hidden="true" />
        <span>
          SMS: {smsStatus}
          <span className="bulk-upload__notice-sub"> — {batch.sms.message}</span>
        </span>
      </div>

      <div className="bulk-upload__result-actions">
        <div className="bulk-upload__result-links">
          <a
            className={`bulk-upload__link${rejects === 0 ? ' bulk-upload__link--disabled' : ''}`}
            data-testid="bulk-rejects-download"
            href={href}
            download={`${batch.id}-rejects.csv`}
            aria-disabled={rejects === 0}
            onClick={(e) => { if (rejects === 0) e.preventDefault(); }}
          >
            <Download size={14} aria-hidden="true" /> Download rejects CSV ({fmt(rejects)})
          </a>
          <a
            className={`bulk-upload__link${recipients === 0 ? ' bulk-upload__link--disabled' : ''}`}
            data-testid="bulk-recipients-download"
            href={recipientsHref}
            download={`${batch.id}-sms-recipients.csv`}
            aria-disabled={recipients === 0}
            onClick={(e) => { if (recipients === 0) e.preventDefault(); }}
          >
            <Download size={14} aria-hidden="true" /> Download SMS recipient list ({fmt(recipients)})
          </a>
        </div>
        {!compact && (
          <div className="bulk-upload__result-buttons">
            {onViewHistory && <GhostButton onClick={onViewHistory}>View in history</GhostButton>}
            {onStartAnother && <PrimaryButton onClick={onStartAnother}>Start another</PrimaryButton>}
          </div>
        )}
      </div>
    </div>
  );
}

export default BulkUploadResult;
