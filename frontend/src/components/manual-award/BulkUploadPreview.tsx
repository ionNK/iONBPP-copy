'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui';
import T from '@/theme/tokens';
import { formatMoney, maskMsisdn } from '@/lib/bulk-upload/markets';
import type { RowStatus, ValidationResult } from '@/lib/bulk-upload/validate';

type Filter = 'all' | RowStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'valid', label: 'Valid' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
];

const STATUS_LABEL: Record<RowStatus, string> = { valid: 'Valid', warning: 'Warning', error: 'Error' };
/* Status pill colours: success / yellow-with-navy-text (same as the wizard's "content incomplete" warning) / destructive. */
const STATUS_COLOR: Record<RowStatus, string> = { valid: T.success, warning: T.yellow, error: T.destructive };

/** Rows rendered at once; large files page through in chunks to keep the DOM light. */
const PAGE = 200;

const fmt = (n: number) => n.toLocaleString('en-GB');

export interface BulkUploadPreviewProps {
  result: ValidationResult;
}

/** Step 3 — validation preview: summary counts, filter chips and the row table with status pills. */
export function BulkUploadPreview({ result }: BulkUploadPreviewProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(PAGE);
  const { summary, rows, mapping } = result;
  const hasUnits = mapping.units !== undefined;
  const hasBetId = mapping.betId !== undefined;
  const hasTurnover = mapping.turnover !== undefined;

  const visible = useMemo(() => (filter === 'all' ? rows : rows.filter((r) => r.status === filter)), [rows, filter]);
  const shown = visible.slice(0, limit);

  const counts: Record<Filter, number> = { all: rows.length, valid: summary.valid, warning: summary.warning, error: summary.error };

  return (
    <div className="bulk-upload__preview">
      <dl className="bulk-upload__summary" aria-label="Validation summary">
        <div className="bulk-upload__stat">
          <dt>Data rows</dt>
          <dd data-testid="bulk-summary-rows">{fmt(rows.length)}</dd>
        </div>
        <div className="bulk-upload__stat bulk-upload__stat--valid">
          <dt>Valid</dt>
          <dd data-testid="bulk-summary-valid">{fmt(summary.valid)}</dd>
        </div>
        <div className="bulk-upload__stat bulk-upload__stat--warning">
          <dt>Warning</dt>
          <dd data-testid="bulk-summary-warning">{fmt(summary.warning)}</dd>
        </div>
        <div className="bulk-upload__stat bulk-upload__stat--error">
          <dt>Error</dt>
          <dd data-testid="bulk-summary-error">{fmt(summary.error)}</dd>
        </div>
        <div className="bulk-upload__stat">
          <dt>Template rows skipped</dt>
          <dd data-testid="bulk-summary-marker">{fmt(summary.markerRowsSkipped)}</dd>
        </div>
        <div className="bulk-upload__stat">
          <dt>Total amount</dt>
          <dd data-testid="bulk-summary-total">{formatMoney(summary.totalFreebet, summary.currency)}</dd>
        </div>
        {summary.totalUnits !== null && (
          <div className="bulk-upload__stat">
            <dt>Total units</dt>
            <dd data-testid="bulk-summary-units">{fmt(summary.totalUnits)}</dd>
          </div>
        )}
      </dl>

      <div className="bulk-upload__filters" role="group" aria-label="Filter rows by status">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`bulk-upload__filter${filter === f.value ? ' bulk-upload__filter--active' : ''}`}
            aria-pressed={filter === f.value}
            data-testid={`bulk-filter-${f.value}`}
            onClick={() => { setFilter(f.value); setLimit(PAGE); }}
          >
            {f.label} <span className="bulk-upload__filter-count">{fmt(counts[f.value])}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="bulk-upload__empty" data-testid="bulk-preview-empty">
          <p className="bulk-upload__empty-title">No data rows found</p>
          <p className="bulk-upload__empty-body">
            {summary.markerRowsSkipped > 0
              ? `The file only contains the header and ${summary.markerRowsSkipped} template marker row${summary.markerRowsSkipped === 1 ? '' : 's'}. Fill in the template and upload again.`
              : 'The file contains a header but no data rows.'}
          </p>
        </div>
      ) : (
        <div className="bulk-upload__table-wrap">
          <table className="bulk-upload__table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Status</th>
                <th scope="col">Customer ID</th>
                {hasBetId && <th scope="col">Bet ID</th>}
                <th scope="col">Amount</th>
                {hasUnits && <th scope="col" data-testid="bulk-preview-units-header">Units</th>}
                {hasTurnover && <th scope="col">Turnover</th>}
                <th scope="col">Messages</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.line} data-testid="bulk-preview-row" data-status={r.status} data-line={r.line}>
                  <td className="bulk-upload__cell-num">{r.line}</td>
                  <td>
                    <Badge color={STATUS_COLOR[r.status]} textColor={r.status === 'warning' ? T.navy : undefined}>
                      {STATUS_LABEL[r.status]}
                    </Badge>
                  </td>
                  <td>
                    {/* MSISDN-keyed rows are masked (domain convention); profile ids are shown as written, with the msisdn beneath when the file has both. */}
                    <span className="bulk-upload__cell-title">{r.customerId ? (r.customerId === r.msisdn ? maskMsisdn(r.customerId) : r.customerId) : '—'}</span>
                    {r.customerIdRaw !== r.customerId && <span className="bulk-upload__cell-sub">{r.customerIdRaw || 'empty'}</span>}
                    {r.msisdn && r.customerId !== r.msisdn && <span className="bulk-upload__cell-sub">{maskMsisdn(r.msisdn)}</span>}
                  </td>
                  {hasBetId && <td><span className="bulk-upload__cell-title">{r.betId || '—'}</span></td>}
                  <td className="bulk-upload__cell-num">{r.amount > 0 ? formatMoney(r.amount, summary.currency) : r.amountRaw || '—'}</td>
                  {hasUnits && <td className="bulk-upload__cell-num" data-testid="bulk-preview-units">{r.units !== null ? fmt(r.units) : r.unitsRaw || '—'}</td>}
                  {hasTurnover && <td className="bulk-upload__cell-num">{r.turnover || '—'}</td>}
                  <td className="bulk-upload__cell-messages">
                    {r.messages.length === 0 ? <span className="bulk-upload__cell-sub">—</span> : r.messages.map((m) => <span key={m}>{m}</span>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length > shown.length && (
            <div className="bulk-upload__table-footer">
              <span className="bulk-upload__hint">Showing {fmt(shown.length)} of {fmt(visible.length)} rows</span>
              <button type="button" className="bulk-upload__link" onClick={() => setLimit((l) => l + PAGE)}>Show more</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BulkUploadPreview;
