'use client';

import { useCallback, useRef, useState } from 'react';
import T from '@/theme/tokens';
import { FilterSelect } from './FilterSelect';
import { GhostButton } from './GhostButton';
import { PrimaryButton } from './PrimaryButton';
import {
  CalendarGrid, PickerPopover, PickerTrigger, ReadOnlyDateField, addDays, addMonths, compareDay, fmtMedium, isSameDay, isSameMonth, startOfDay, startOfMonth, useMediaQuery,
} from './CalendarGrid';
import './ui.css';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (value: DateRange | null) => void;
  /** Show the preset column (Today · Yesterday · This week · …). */
  presets?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}

/* Presets resolve relative to "now" at click time; weeks start on Sunday. */
const PRESETS: { label: string; range: (now: Date) => DateRange }[] = [
  { label: 'Today', range: (n) => ({ from: startOfDay(n), to: startOfDay(n) }) },
  { label: 'Yesterday', range: (n) => ({ from: addDays(startOfDay(n), -1), to: addDays(startOfDay(n), -1) }) },
  { label: 'This week', range: (n) => { const from = addDays(startOfDay(n), -n.getDay()); return { from, to: addDays(from, 6) }; } },
  { label: 'Last week', range: (n) => { const from = addDays(startOfDay(n), -n.getDay() - 7); return { from, to: addDays(from, 6) }; } },
  { label: 'This month', range: (n) => ({ from: startOfMonth(n), to: addDays(addMonths(n, 1), -1) }) },
  { label: 'Last month', range: (n) => ({ from: addMonths(n, -1), to: addDays(startOfMonth(n), -1) }) },
  { label: 'This year', range: (n) => ({ from: new Date(n.getFullYear(), 0, 1), to: new Date(n.getFullYear(), 11, 31) }) },
];

const PRESET_LABELS = PRESETS.map((p) => p.label);

function sameRange(a: DateRange | null, b: DateRange | null): boolean {
  return !!a && !!b && isSameDay(a.from, b.from) && isSameDay(a.to, b.to);
}

/**
 * Two-month range picker (single month below 1024px). Click / Enter on a
 * day sets the start, the second sets the end (order-normalised). Selection
 * is a draft until Apply; Cancel / Escape / outside click discard it.
 */
export function DateRangePicker({ value, onChange, presets = true, minDate, maxDate, disabled, placeholder, ariaLabel }: DateRangePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const compact = useMediaQuery('(max-width: 1023px)');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | null>(value);
  /* While picking the second day only `from` is committed. */
  const [pendingFrom, setPendingFrom] = useState<Date | null>(null);
  const [hover, setHover] = useState<Date | null>(null);
  const [month, setMonth] = useState<Date>(() => startOfMonth(value?.from ?? new Date()));
  const [focusDay, setFocusDay] = useState<Date>(() => startOfDay(value?.from ?? new Date()));

  const openPopover = () => {
    const base = value?.from ?? new Date();
    setDraft(value);
    setPendingFrom(null);
    setHover(null);
    setMonth(startOfMonth(base));
    setFocusDay(startOfDay(base));
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);
  const apply = () => { onChange(draft); setOpen(false); };

  const pickDay = (day: Date) => {
    const d = startOfDay(day);
    if (!pendingFrom) { setPendingFrom(d); setDraft(null); return; }
    const [from, to] = compareDay(d, pendingFrom) < 0 ? [d, pendingFrom] : [pendingFrom, d];
    setDraft({ from, to });
    setPendingFrom(null);
  };
  const pickPreset = (label: string) => {
    const preset = PRESETS.find((p) => p.label === label);
    if (!preset) return;
    const range = preset.range(new Date());
    setDraft(range);
    setPendingFrom(null);
    setMonth(startOfMonth(range.from));
    setFocusDay(range.from);
  };

  /* Visual range: the draft, or the in-progress from→hover preview. */
  const preview = pendingFrom && hover
    ? (compareDay(hover, pendingFrom) < 0 ? { from: hover, to: pendingFrom } : { from: pendingFrom, to: hover })
    : draft;
  const selected = pendingFrom ? [pendingFrom] : draft ? [draft.from, draft.to] : [];
  const activePreset = PRESETS.find((p) => sameRange(p.range(new Date()), draft))?.label ?? null;
  const text = value ? `${fmtMedium(value.from)} - ${fmtMedium(value.to)}` : '';
  const secondMonth = addMonths(month, 1);

  const gridProps = {
    selected, range: preview, focusDay, onFocusDay: setFocusDay, onSelect: pickDay, onHoverDay: setHover, minDate, maxDate,
  };

  /* Keyboard / arrow navigation across the pair: only shift when the target month is not already visible. */
  const revealMonth = (m: Date) => {
    if (isSameMonth(m, month) || (!compact && isSameMonth(m, secondMonth))) return;
    setMonth(compareDay(m, month) < 0 || compact ? startOfMonth(m) : addMonths(m, -1));
  };

  return (
    <div className="ui-picker">
      <PickerTrigger
        buttonRef={triggerRef}
        text={text}
        placeholder={placeholder ?? 'Select a date range'}
        open={open}
        onToggle={() => (open ? close() : openPopover())}
        disabled={disabled}
        ariaLabel={ariaLabel}
      />
      <PickerPopover open={open} anchorRef={triggerRef} onClose={close} ariaLabel={ariaLabel ?? 'Choose a date range'}>
        <div className={`ui-range${compact ? ' ui-range--compact' : ''}`}>
          {presets && !compact && (
            <div className="ui-range__presets" style={{ borderRight: `1px solid ${T.border}` }} role="group" aria-label="Presets">
              {PRESETS.map((p) => {
                const active = p.label === activePreset;
                return (
                  <button
                    key={p.label}
                    type="button"
                    className="ui-range__preset"
                    aria-pressed={active}
                    onClick={() => pickPreset(p.label)}
                    style={{ borderRadius: T.radiusSm, color: T.textPrimary, background: active ? T.activeFill : 'transparent', fontWeight: active ? 600 : 400 }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.offWhite; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}
          <div className="ui-range__main">
            {presets && compact && (
              <div className="ui-range__preset-select">
                <FilterSelect label={activePreset ?? 'Presets'} options={PRESET_LABELS} onChange={pickPreset} />
              </div>
            )}
            <div className="ui-range__months">
              <CalendarGrid {...gridProps} month={month} onMonthChange={revealMonth} hideNext={!compact} autoFocus />
              {!compact && <CalendarGrid {...gridProps} month={secondMonth} onMonthChange={revealMonth} hidePrev />}
            </div>
          </div>
        </div>
        <div className="ui-picker__footer" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="ui-range__fields">
            <ReadOnlyDateField ariaLabel="Start date" value={draft ? fmtMedium(draft.from) : pendingFrom ? fmtMedium(pendingFrom) : ''} />
            <span style={{ color: T.textSecondary }} aria-hidden="true">–</span>
            <ReadOnlyDateField ariaLabel="End date" value={draft ? fmtMedium(draft.to) : ''} />
          </div>
          <div className="ui-picker__footer-actions">
            <GhostButton small onClick={close}>Cancel</GhostButton>
            <PrimaryButton onClick={apply} disabled={!draft}>Apply</PrimaryButton>
          </div>
        </div>
      </PickerPopover>
    </div>
  );
}

export default DateRangePicker;
