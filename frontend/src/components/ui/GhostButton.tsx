'use client';

import type { ReactNode } from 'react';
import T from '@/theme/tokens';
import './ui.css';

export interface GhostButtonProps {
children: ReactNode;
onClick?: () => void;
small?: boolean;
ariaLabel?: string;
}

/** Ghost button — Unity Button/Ghost: ghostBorder outline on white. */
export function GhostButton({ children, onClick, small, ariaLabel }: GhostButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
 className={`promo-btn-ghost${small ? ' promo-btn-ghost--small' : ''}`}
      style={{ border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, color: T.textPrimary, background: T.white }}
    >
      {children}
    </button>
  );
}

export default GhostButton;
