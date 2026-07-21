'use client';
import { useState, useEffect } from 'react';

import { X, AlertTriangle } from 'lucide-react';

interface ActionModalProps {
  title: string;
  /** Short description shown under the title. */
  description?: string;
  /** Label for the confirm button, e.g. "Pause Promotion". */
  confirmLabel: string;
  /** When true, the reason field must be filled before confirming. */
  reasonRequired?: boolean;
  /** Placeholder for the reason/comment textarea. */
  reasonPlaceholder?: string;
  /** Danger styling for destructive actions (end / emergency stop / reject). */
  danger?: boolean;
  /** Optional confirmation phrase the user must type (e.g. "STOP"). */
  confirmPhrase?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function ActionModal({
  title,
  description,
  confirmLabel,
  reasonRequired = true,
  reasonPlaceholder = 'Enter a reason for the audit trail…',
  danger = false,
  confirmPhrase,
  onConfirm,
  onCancel,
}: ActionModalProps) {
  const [reason, setReason] = useState('');
  const [phrase, setPhrase] = useState('');

  const reasonOk = !reasonRequired || reason.trim().length >= 3;
  const phraseOk = !confirmPhrase || phrase.trim() === confirmPhrase;
  const canConfirm = reasonOk && phraseOk;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);


  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className={danger ? 'danger' : ''}>
            {danger && <AlertTriangle size={18} />} {title}
          </h3>
          <button className="close" onClick={onCancel}><X size={18} /></button>
        </div>

        {description && <p className="desc">{description}</p>}

        <label className="field-label">
          Reason {reasonRequired && <span className="req">*</span>}
        </label>
        <textarea
          className="reason"
          rows={4}
          placeholder={reasonPlaceholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />

        {confirmPhrase && (
          <>
            <label className="field-label">
              Type <b>{confirmPhrase}</b> to confirm
            </label>
            <input
              className="phrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={confirmPhrase}
            />
          </>
        )}

        <div className="modal-actions">
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${danger ? 'danger' : 'primary'}`}
            disabled={!canConfirm}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: 14px; padding: 24px; width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,.4); animation: modalIn .18s ease-out; }
        @keyframes modalIn { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .modal-head h3 { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 700; margin: 0; color: var(--color-text-primary); }
        .modal-head h3.danger { color: #f87171; }
        .close { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; }
        .close:hover { color: var(--color-text-primary); }
        .desc { font-size: 13px; color: var(--color-text-muted); line-height: 1.5; margin: 0 0 16px; }
        .field-label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .03em; margin: 12px 0 6px; }
        .req { color: #f87171; }
        .reason, .phrase { width: 100%; background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 8px; padding: 10px 12px; font-size: 13px; color: var(--color-text-primary); font-family: inherit; resize: vertical; }
        .reason:focus, .phrase:focus { outline: none; border-color: var(--color-betika-yellow); box-shadow: 0 0 0 2px rgba(255,204,0,.2); }

        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .btn { padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--color-border); }
        .btn:disabled { opacity: .45; cursor: not-allowed; }
        .btn.ghost { background: transparent; color: var(--color-text-muted); }
        .btn.ghost:hover { color: var(--color-text-primary); }
        .btn.primary { background: var(--color-betika-yellow); color: #000; border-color: var(--color-betika-yellow); }
        .btn.danger { background: #dc2626; color: #fff; border-color: #dc2626; }
      `}</style>
    </div>
  );
}
