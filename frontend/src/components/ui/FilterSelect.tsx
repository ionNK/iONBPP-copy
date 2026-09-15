'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import T from '@/theme/tokens';
import './ui.css';

/* Inline lucide chevron-down path — lucide-react is not a dependency yet. */
function ChevronDownIcon({ size = 16, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export interface FilterSelectProps {
label: string;
options: string[];
onChange: (value: string) => void;
}

/** Dropdown filter select — Unity Dropdown Menu trigger + menu. */
export function FilterSelect({ label, options, onChange }: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="promo-select">
      <button
        onClick={() => setOpen((o) => !o)}
        className="promo-select__trigger"
        style={{ border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, color: T.textPrimary, background: T.white }}
      >
        {label} <ChevronDownIcon size={14} style={{ color: T.textSecondary }} />
      </button>
      {open && (
        <div
          className="promo-select__menu"
          style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, boxShadow: '0 12px 20px rgba(0,0,0,0.10)' }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="promo-select__option"
              style={{ color: T.textPrimary }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
              onMouseLeave={(e) => (e.currentTarget.style.background = T.white)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterSelect;
