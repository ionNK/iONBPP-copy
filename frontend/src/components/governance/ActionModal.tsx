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
    <div className="modal-overlay governance-action-modal" onClick={onCancel}>
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
    </div>
  );
}
