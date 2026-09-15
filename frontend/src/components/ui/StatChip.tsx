'use client';

import T from '@/theme/tokens';
import './ui.css';

export interface StatChipProps {
label: string;
value: number;
active: boolean;
onClick: () => void;
}

/** Filterable stat chip — Unity Chips. */
export function StatChip({ label, value, active, onClick }: StatChipProps) {
  return (
    <button
      onClick={onClick}
      className="promo-chip"
      style={{ border: `1px solid ${active ? T.navy : T.border}`, borderRadius: T.radiusSm, background: active ? T.navy : T.white }}
    >
      <span className="promo-chip__value" style={{ color: active ? T.white : T.textPrimary }}>{value}</span>
      <span className="promo-chip__label" style={{ color: active ? 'rgba(255,255,255,0.75)' : T.textSecondary }}>{label}</span>
    </button>
  );
}

export default StatChip;
