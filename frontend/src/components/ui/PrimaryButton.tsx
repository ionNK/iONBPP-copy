'use client';

import type { ReactNode } from 'react';
import T from '@/theme/tokens';
import './ui.css';

export interface PrimaryButtonProps {
children: ReactNode;
onClick: () => void;
disabled?: boolean;
}

/** Primary button: Unity Button/Default, yellow background + navy text. */
export function PrimaryButton({ children, onClick, disabled }: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
 className="promo-btn-primary"
      style={{ background: T.yellow, color: T.navy, borderRadius: T.radiusSm }}
      onMouseDown={(e) => {
 if (!disabled) e.currentTarget.style.background = T.yellowActive;
 }}
      onMouseUp={(e) => {
 if (!disabled) e.currentTarget.style.background = T.yellow;
 }}
    >
      {children}
    </button>
  );
}

export default PrimaryButton;
