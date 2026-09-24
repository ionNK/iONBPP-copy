'use client';

import { X } from 'lucide-react';
import T from '@/theme/tokens';
import './ui.css';

export interface FilterChipProps {
  /** Facet name, e.g. "Status". Rendered in textSecondary before the value. */
  label: string;
  /** Selected value(s), e.g. "Active" or "Web, App". */
  value: string;
  /** Called when the × is pressed; the chip is removed by the caller. */
  onRemove: () => void;
}

/**
 * Active-filter chip: Unity Chip (dismissible). Ghost pill — white fill,
 * ghostBorder outline, 12px "Label: value" text, 14px × icon button on the
 * trailing edge. Rendered in a wrapping row under the filter toolbar.
 */
export function FilterChip({ label, value, onRemove }: FilterChipProps) {
  return (
    <span
      className="ui-filter-chip"
      style={{ background: T.white, border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusPill, color: T.textPrimary }}
    >
      <span className="ui-filter-chip__text">
        <span style={{ color: T.textSecondary }}>{label}:</span> {value}
      </span>
      <button
        type="button"
        className="ui-filter-chip__remove"
        style={{ color: T.textSecondary, borderRadius: T.radiusPill }}
        aria-label={`Remove ${label} filter: ${value}`}
        onClick={onRemove}
        onMouseEnter={(e) => (e.currentTarget.style.background = T.activeFill)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </span>
  );
}

export default FilterChip;
