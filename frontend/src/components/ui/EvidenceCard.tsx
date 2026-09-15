'use client';

import type { ReactNode } from 'react';
import T from '@/theme/tokens';
import './ui.css';

export interface EvidenceCardProps {
title: string;
meta?: string;
icon?: ReactNode;
action?: ReactNode;
children?: ReactNode;
}

/** Evidence attachment card — white surface, border, Radius/Small. */
export function EvidenceCard({ title, meta, icon, action, children }: EvidenceCardProps) {
  return (
    <div
      className="ui-evidence-card"
      style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}
    >
      {icon && (
        <span className="ui-evidence-card__icon" style={{ color: T.textSecondary }}>
          {icon}
        </span>
      )}
      <div className="ui-evidence-card__body">
        <div className="ui-evidence-card__title" style={{ color: T.textPrimary }}>{title}</div>
        {meta && (
          <div className="ui-evidence-card__meta" style={{ color: T.textSecondary }}>{meta}</div>
        )}
        {children}
      </div>
      {action && <div className="ui-evidence-card__action">{action}</div>}
    </div>
  );
}

export default EvidenceCard;
