'use client';

import type { ReactNode } from 'react';
import T from '@/theme/tokens';
import './ui.css';

export interface DestructiveGhostButtonProps {
children: ReactNode;
onClick?: () => void;
small?: boolean;
}

/** Ghost button in the destructive colour — Unity Button Ghost × Destructive. */
export function DestructiveGhostButton({ children, onClick, small }: DestructiveGhostButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`promo-btn-ghost${small ? ' promo-btn-ghost--small' : ''}`}
      style={{ border: `1px solid ${T.destructive}`, borderRadius: T.radiusSm, color: T.destructive, background: T.white }}
      onMouseDown={(e) => {
        e.currentTarget.style.color = T.destructiveActive;
        e.currentTarget.style.borderColor = T.destructiveActive;
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.color = T.destructive;
        e.currentTarget.style.borderColor = T.destructive;
      }}
    >
      {children}
    </button>
  );
}

export default DestructiveGhostButton;
