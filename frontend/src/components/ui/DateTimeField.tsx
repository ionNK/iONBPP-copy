'use client';

import { useCallback, useRef, useState } from 'react';
import T from '@/theme/tokens';
import { FilterSelect } from './FilterSelect';
import { GhostButton } from './GhostButton';
import { PrimaryButton } from './PrimaryButton';
import {
  CalendarGrid, PickerPopover, PickerTrigger, fmtDayMonthYear, fmtTime24, pad2, startOfDay, startOfMonth, withTime,
} from './CalendarGrid';
import './ui.css';

/* ------------------------------------------------------------------ */
/* Value adapters: consumers that persist ISO-style strings use these   */
/* so their stored shape does not change when swapping to the picker.  */
/* ------------------------------------------------------------------ */

/** Local calendar date → "YYYY-MM-DD" (the shape a native date input produced). */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Local wall-clock time → "HH:mm" (the shape a native time input produced). */
export function toIsoTime(d: Date): string {
  return fmtTime24(d);
}

/** Local date + time → "YYYY-MM-DDTHH:mm" (the shape a native datetime-local input produced). */
export function toIsoDateTime(d: Date): string {
  return `${toIsoDate(d)}T${toIsoTime(d)}`;
}

/**
 * Parses "YYYY-MM-DD", "YYYY-MM-DDTHH:mm" or a separate ("YYYY-MM-DD", "HH:mm")
 * pair into a local Date. Returns null for empty / malformed input.
 */
export function parseIsoDateTime(date: string, time?: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(date);
  if (!m) return null;
  let hh = Number(m[4] ?? 0);
  let mm = Number(m[5] ?? 0);
  if (time) {
    const t = /^(\d{2}):(\d{2})/.exec(time);
    if (t) { hh = Number(t[1]); mm = Number(t[2]); }
  }
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hh, mm);
  return Number.isNaN(d.getTime()) ? null : d;
}

const HOURS = Array.from({ length: 24 }, (_, i) => pad2(i));
const MINUTES = Array.from({ length: 12 }, (_, i) => pad2(i * 5));

/* ------------------------------------------------------------------ */
/* TimeField: inline hour / minute pair (24h). Used where a form needs  */
/* a time without a date (e.g. "Next day at").                          */
/* ------------------------------------------------------------------ */

export interface TimeFieldProps {
  /** "HH:mm" in 24h format; '' when unset. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function TimeField({ value, onChange, disabled, ariaLabel }: TimeFieldProps) {
  const [hh = '', mm = ''] = value ? value.split(':') : [];
  return (
    <div
      className={`ui-timefield${disabled ? ' ui-timefield--disabled' : ''}`}
      role="group"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
    >
      <FilterSelect label={hh || '--'} options={HOURS} onChange={(h) => onChange(`${h}:${mm || '00'}`)} />
      <span style={{ color: T.textSecondary }} aria-hidden="true">:</span>
      <FilterSelect label={mm || '--'} options={MINUTES} onChange={(m) => onChange(`${hh || '00'}:${m}`)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DateTimeField                                                       */
/* ------------------------------------------------------------------ */

export interface DateTimeFieldProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  /** Adds a 24h hour / minute row beneath the calendar. */
  showTime?: boolean;
  /** 12px caption next to the time row, e.g. "Africa/Lusaka". */
  timezoneLabel?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  /** Renders the trigger with the destructive border (validation error). */
  invalid?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  /** Stretch the trigger to the field width (default true: form usage). */
  block?: boolean;
}

/**
 * Single date (optionally date + time) picker. Selection is a draft until
 * Apply; Cancel / Escape / outside click discard it. Trigger reads
 * "20 Aug 2026, 10:00" (24h, Africa/Lusaka convention: no AM/PM).
 */
export function DateTimeField({
  value, onChange, showTime, timezoneLabel, minDate, maxDate, disabled, invalid, placeholder, ariaLabel, block = true,
}: DateTimeFieldProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date | null>(value);
  const [month, setMonth] = useState<Date>(() => startOfMonth(value ?? new Date()));
  const [focusDay, setFocusDay] = useState<Date>(() => startOfDay(value ?? new Date()));

  const openPopover = () => {
    const base = value ?? new Date();
    setDraft(value);
    setMonth(startOfMonth(base));
    setFocusDay(startOfDay(base));
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);
  const apply = () => { onChange(draft); setOpen(false); };

  const text = value ? (showTime ? `${fmtDayMonthYear(value)}, ${fmtTime24(value)}` : fmtDayMonthYear(value)) : '';
  const draftTime = draft ?? withTime(new Date(), null);
  const setTime = (hh: number, mm: number) => {
    const day = draft ?? startOfDay(focusDay);
    setDraft(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm));
  };

  return (
    <div className="ui-picker">
      <PickerTrigger
        buttonRef={triggerRef}
        text={text}
        placeholder={placeholder ?? (showTime ? 'Select date and time' : 'Select date')}
        open={open}
        onToggle={() => (open ? close() : openPopover())}
        disabled={disabled}
        invalid={invalid}
        ariaLabel={ariaLabel}
        block={block}
      />
      <PickerPopover open={open} anchorRef={triggerRef} onClose={close} ariaLabel={ariaLabel ?? 'Choose a date'}>
        <div className="ui-picker__body">
          <CalendarGrid
            month={month}
            onMonthChange={setMonth}
            selected={draft ? [draft] : []}
            focusDay={focusDay}
            onFocusDay={setFocusDay}
            onSelect={(day) => setDraft(showTime ? withTime(day, draft) : startOfDay(day))}
            minDate={minDate}
            maxDate={maxDate}
            autoFocus
          />
          {showTime && (
            <div className="ui-picker__time" style={{ borderTop: `1px solid ${T.border}` }}>
              <div className="ui-picker__time-selects" role="group" aria-label="Time (24-hour)">
                <FilterSelect label={pad2(draftTime.getHours())} options={HOURS} onChange={(h) => setTime(Number(h), draftTime.getMinutes())} />
                <span style={{ color: T.textSecondary }} aria-hidden="true">:</span>
                <FilterSelect label={pad2(draftTime.getMinutes())} options={MINUTES} onChange={(m) => setTime(draftTime.getHours(), Number(m))} />
              </div>
              {timezoneLabel && <span className="ui-picker__tz" style={{ color: T.textSecondary }}>{timezoneLabel}</span>}
            </div>
          )}
        </div>
        <div className="ui-picker__footer" style={{ borderTop: `1px solid ${T.border}` }}>
          <span className="ui-picker__footer-value" style={{ color: T.textSecondary }}>
            {draft ? (showTime ? `${fmtDayMonthYear(draft)}, ${fmtTime24(draft)}` : fmtDayMonthYear(draft)) : 'No date selected'}
          </span>
          <div className="ui-picker__footer-actions">
            <GhostButton small onClick={close}>Cancel</GhostButton>
            <PrimaryButton onClick={apply} disabled={!draft}>Apply</PrimaryButton>
          </div>
        </div>
      </PickerPopover>
    </div>
  );
}

export default DateTimeField;
