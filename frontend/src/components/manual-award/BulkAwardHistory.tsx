'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatMoney } from '@/lib/bulk-upload/markets';
import { AWARD_LABEL, listBatches } from '@/lib/bulk-upload/mockBatches';
import type { Batch } from '@/lib/bulk-upload/mockBatches';
import { BatchStatusBadge, BulkUploadResult } from './BulkUploadResult';

const fmt = (n: number) => n.toLocaleString('en-GB');

const formatCreated = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

export interface BulkAwardHistoryProps {
  /** Bump to re-read the batch store (e.g. after a submit). */
  refreshKey?: number;
  /** Batch to expand initially (e.g. after "View in history"). */
  focusId?: string | null;
}

/** Batch history — newest first; clicking a row expands its result panel with the rejects download. */
export function BulkAwardHistory({ refreshKey = 0, focusId = null }: BulkAwardHistoryProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  /* Hydrate from localStorage after mount; re-read whenever the parent bumps refreshKey. */
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- hydration from localStorage */
    setBatches(listBatches());
  }, [refreshKey]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- parent-driven focus after submit */
    if (focusId) setOpenId(focusId);
  }, [focusId]);

  return (
    <section className="bulk-upload__history" aria-labelledby="bulk-history-title" data-testid="bulk-history">
      <div className="bulk-upload__history-head">
        <h2 id="bulk-history-title" className="bulk-upload__section-title">Batch history</h2>
        <span className="bulk-upload__hint">{fmt(batches.length)} batch{batches.length === 1 ? '' : 'es'} · newest first</span>
      </div>

      {batches.length === 0 ? (
        <div className="bulk-upload__empty" data-testid="bulk-history-empty">
          <p className="bulk-upload__empty-title">No batches yet</p>
          <p className="bulk-upload__empty-body">Submitted bulk award batches appear here with their outcome, rejects file and SMS recipient list.</p>
        </div>
      ) : (
        <div className="bulk-upload__table-wrap">
          <table className="bulk-upload__table bulk-upload__table--history">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Reference</th>
                <th scope="col">Market</th>
                <th scope="col">Type</th>
                <th scope="col">Rows</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                <th scope="col">Created</th>
                <th scope="col"><span className="bulk-upload__sr-only">Expand</span></th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const open = openId === b.id;
                return [
                  <tr
                    key={b.id}
                    className={`bulk-upload__history-row${open ? ' bulk-upload__history-row--open' : ''}`}
                    data-testid="bulk-history-row"
                    data-status={b.status}
                    data-batch-id={b.id}
                    aria-expanded={open}
                    tabIndex={0}
                    onClick={() => setOpenId(open ? null : b.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenId(open ? null : b.id); } }}
                  >
                    <td>
                      <span className="bulk-upload__cell-title" data-testid="bulk-history-name">{b.name}</span>
                      <span className="bulk-upload__cell-sub">{b.id} · {b.createdBy}</span>
                    </td>
                    <td>{b.reference || '—'}</td>
                    <td>{b.market}</td>
                    <td data-testid="bulk-history-type">{AWARD_LABEL[b.awardType]}</td>
                    <td className="bulk-upload__cell-num">{fmt(b.rowCount)}</td>
                    <td className="bulk-upload__cell-num">{formatMoney(b.totalFreebet, b.currency)}</td>
                    <td data-testid="bulk-history-status"><BatchStatusBadge status={b.status} /></td>
                    <td className="bulk-upload__cell-sub">{formatCreated(b.createdAt)}</td>
                    <td className="bulk-upload__cell-chevron" aria-hidden="true">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                  </tr>,
                  open ? (
                    <tr key={`${b.id}-detail`} className="bulk-upload__history-detail" data-testid="bulk-history-detail">
                      <td colSpan={9}>
                        <BulkUploadResult batch={b} compact />
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default BulkAwardHistory;
