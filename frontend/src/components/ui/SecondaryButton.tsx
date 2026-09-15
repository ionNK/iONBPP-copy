'use client';

import type { ReactNode } from 'react';
import T from '@/theme/tokens';
import './ui.css';

export interface SecondaryButtonProps {
children: ReactNode;
onClick: () => void;
}

/** Secondary button — Unity Button/Secondary: navyDeep background + white text. */
export function SecondaryButton({ children, onClick }: SecondaryButtonProps) {
  return (
    <button
      onClick={onClick}
      className="promo-btn-primary"
      style={{ background: T.navyDeep, color: T.white, borderRadius: T.radiusSm }}
      onMouseDown={(e) => (e.currentTarget.style.background = T.navy)}
      onMouseUp={(e) => (e.currentTarget.style.background = T.navyDeep)}
    >
      {children}
    </button>
  );
}

export default SecondaryButton;
