'use client';

import { useCallback, useState } from 'react';
import T from '@/theme/tokens';
import { ZambiaFlag } from '@/components/ui';
import { BulkUploadStepper } from '@/components/manual-award/BulkUploadStepper';
import { BulkAwardHistory } from '@/components/manual-award/BulkAwardHistory';
import type { Batch } from '@/lib/bulk-upload/mockBatches';
/* Shared page-skeleton structural classes (top bar, container, empty state) */
import '../promotions.css';

type Mode = 'single' | 'bulk';

/**
 * Manual Award / Bulk Upload page. Mode toggle (segmented control): Single keeps
 * the existing placeholder untouched (default); Bulk Upload mounts the
 * BulkUploadStepper (PROTOTYPE, mock data) with BulkAwardHistory beneath.
 */
export default function BulkUploadPage() {
  const [mode, setMode] = useState<Mode>('single');
  const [historyKey, setHistoryKey] = useState(0);
  const [focusId, setFocusId] = useState<string | null>(null);

  const onSubmitted = useCallback(() => setHistoryKey((k) => k + 1), []);
  const onViewHistory = useCallback((batch: Batch) => {
    setFocusId(batch.id);
    document.getElementById('bulk-history-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div
      className="promo-page"
      style={{ background: T.offWhite, fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Top bar */}
      <div
        className="promo-topbar"
        style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}
      >
        <div>
          <div className="promo-title-row">
            <h1 className="promo-title" style={{ color: T.textPrimary }}>Bulk Upload</h1>
            <ZambiaFlag />
          </div>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>
            ionix Boost
          </p>
        </div>

        {/* Segmented control: Single | Bulk Upload (same pattern as the dashboard period control). */}
        <div className="bulk-upload-mode" role="group" aria-label="Award mode" data-testid="bulk-mode-toggle">
          <button
            type="button"
            className={`bulk-upload-mode__btn${mode === 'single' ? ' bulk-upload-mode__btn--active' : ''}`}
            aria-pressed={mode === 'single'}
            data-testid="bulk-mode-single"
            onClick={() => setMode('single')}
          >
            Single
          </button>
          <button
            type="button"
            className={`bulk-upload-mode__btn${mode === 'bulk' ? ' bulk-upload-mode__btn--active' : ''}`}
            aria-pressed={mode === 'bulk'}
            data-testid="bulk-mode-bulk"
            onClick={() => setMode('bulk')}
          >
            Bulk Upload
          </button>
        </div>
      </div>

      <div className="promo-container">
        {mode === 'single' ? (
          <div
            style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}
          >
            <div className="promo-empty">
              <p className="promo-empty__title" style={{ color: T.textPrimary }}>
                Bulk Upload coming soon
              </p>
              <p className="promo-empty__body" style={{ color: T.textSecondary }}>
                Upload freebet award files for vetting and crediting.
              </p>
            </div>
          </div>
        ) : (
          <>
            <BulkUploadStepper onSubmitted={onSubmitted} onViewHistory={onViewHistory} />
            <BulkAwardHistory refreshKey={historyKey} focusId={focusId} />
          </>
        )}
      </div>
    </div>
  );
}
