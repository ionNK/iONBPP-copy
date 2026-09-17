'use client';

import type { ReactNode } from 'react';
import T from '@/theme/tokens';
import './ui.css';

export interface BadgeProps {
color: string;
/** Ghost variant: white fill, ghostBorder outline, colored text (e.g. Pending approval). */
ghost?: boolean;
/** Override the text colour (e.g. dark foreground on the yellow warning badge). */
textColor?: string;
children: ReactNode;
}

/** Pill badge: Unity Badge (Pill shape). */
export function Badge({ color, ghost, textColor, children }: BadgeProps) {
  return (
    <span
      className="promo-badge"
      style={
 ghost
 ? { background: T.white, color: textColor ?? color, border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusPill }
 : { background: color, color: textColor ?? T.white, borderRadius: T.radiusPill }
}
    >
      {children}
    </span>
  );
}

export default Badge;
