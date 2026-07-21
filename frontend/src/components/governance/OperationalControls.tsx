'use client';
// Operational controls for a running promotion: Pause / Resume / End / Emergency Stop.
//
// Every action:
//   - is gated on the signed-in role's permission (`can(...)`),
//   - requires a mandatory reason (captured via ActionModal),
//   - and is written to the shared audit trail (`recordAudit`).
//
// The parent owns the promotion state and receives the new state via `onStateChange`
// so the surrounding UI (monitor cards, detail header) stays in sync.

import { useState } from 'react';
import { Pause, Play, Square, AlertTriangle } from 'lucide-react';
import ActionModal from './ActionModal';
import { can, type Permission } from '@/lib/permissions';
import { recordAudit, type AuditActionType } from '@/lib/audit';

export type PromoState = 'active' | 'paused' | 'ended';

type ControlKey = 'pause' | 'resume' | 'end' | 'emergency_stop';

interface ControlDef {
  key: ControlKey;
  label: string;
  permission: Permission;
  action: AuditActionType;
  danger?: boolean;
  confirmPhrase?: string;
  /** States in which this control is available. */
  visibleWhen: PromoState[];
  /** State the promotion moves to after the action. */
  resultState: PromoState;
  description: string;
}

const CONTROLS: ControlDef[] = [
  {
    key: 'pause',
    label: 'Pause',
    permission: 'promotion.pause',
    action: 'pause',
    visibleWhen: ['active'],
    resultState: 'paused',
    description: 'Temporarily halt enrolments and awards. The promotion can be resumed later.',
  },
  {
    key: 'resume',
    label: 'Resume',
    permission: 'promotion.resume',
    action: 'resume',
    visibleWhen: ['paused'],
    resultState: 'active',
    description: 'Resume enrolments and awards for this promotion.',
  },
  {
    key: 'end',
    label: 'End',
    permission: 'promotion.end',
    action: 'end',
    danger: true,
    visibleWhen: ['active', 'paused'],
    resultState: 'ended',
    description: 'Permanently end this promotion. Enrolments stop and no further awards will be issued. This cannot be undone.',
  },
  {
    key: 'emergency_stop',
    label: 'Emergency Stop',
    permission: 'promotion.emergency_stop',
    action: 'emergency_stop',
    danger: true,
    confirmPhrase: 'STOP',
    visibleWhen: ['active', 'paused'],
    resultState: 'ended',
    description: 'Immediately kill this promotion and freeze all pending awards. Use only for suspected abuse, budget breach or a critical defect.',
  },
];

interface Props {
  promotionId: string;
  promotionName: string;
  market: string;
  state: PromoState;
  onStateChange: (next: PromoState) => void;
  /** Compact renders icon-only buttons (monitor cards); default is labelled. */
  compact?: boolean;
}

export default function OperationalControls({
  promotionId,
  promotionName,
  market,
  state,
  onStateChange,
  compact = false,
}: Props) {
  const [active, setActive] = useState<ControlDef | null>(null);

  const visible = CONTROLS.filter((c) => c.visibleWhen.includes(state));

  if (state === 'ended') {
    return <span className="oc-ended">This promotion has ended — no operational controls available.</span>;
  }

  const iconFor = (k: ControlKey) => {
    switch (k) {
      case 'pause': return <Pause size={14} />;
      case 'resume': return <Play size={14} />;
      case 'end': return <Square size={14} />;
      case 'emergency_stop': return <AlertTriangle size={14} />;
    }
  };

  const handleConfirm = (reason: string) => {
    if (!active) return;
    recordAudit({
      action: active.action,
      targetId: promotionId,
      targetName: promotionName,
      market,
      reason,
    });
    onStateChange(active.resultState);
    setActive(null);
  };

  return (
    <div className="oc-wrap">
      {visible.map((c) => {
        const allowed = can(c.permission);
        return (
          <button
            key={c.key}
            className={`oc-btn ${c.danger ? 'danger' : ''} ${compact ? 'compact' : ''}`}
            disabled={!allowed}
            title={allowed ? c.description : `Requires ${c.permission} permission`}
            onClick={() => setActive(c)}
          >
            {iconFor(c.key)}
            {!compact && <span>{c.label}</span>}
          </button>
        );
      })}

      {active && (
        <ActionModal
          title={`${active.label} — ${promotionName}`}
          description={active.description}
          confirmLabel={active.label}
          reasonRequired
          reasonPlaceholder={`Reason for ${active.label.toLowerCase()} (recorded in the audit trail)…`}
          danger={active.danger}
          confirmPhrase={active.confirmPhrase}
          onConfirm={handleConfirm}
          onCancel={() => setActive(null)}
        />
      )}

      <style jsx>{`
        .oc-wrap { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .oc-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-input); color: var(--color-text-primary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
        .oc-btn.compact { padding: 6px 9px; }
        .oc-btn:hover:not(:disabled) { border-color: var(--color-primary); }
        .oc-btn.danger { color: #f87171; border-color: rgba(248,113,113,.4); }
        .oc-btn.danger:hover:not(:disabled) { background: rgba(248,113,113,.12); border-color: #f87171; }
        .oc-btn:disabled { opacity: .4; cursor: not-allowed; }
        .oc-ended { font-size: 12px; color: var(--color-text-muted); font-style: italic; }
      `}</style>
    </div>
  );
}
