'use client';

/**
 * Internal calendar primitives shared by DateRangePicker and DateTimeField.
 * Not exported from the ui barrel: consumers use the two pickers.
 *
 * Plain Date math only (no date library). Weeks start on Sunday per the
 * Unity Figma. Colors come from T; layout lives in ui.css (.ui-cal-*).
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import T from '@/theme/tokens';
import './ui.css';

/* ------------------------------------------------------------------ */
/* Date math                                                           */
/* ------------------------------------------------------------------ */

export const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Midnight (local) of the given date. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Day-granular comparison: -1 / 0 / 1. */
export function compareDay(a: Date, b: Date): number {
  const x = startOfDay(a).getTime();
  const y = startOfDay(b).getTime();
  return x < y ? -1 : x > y ? 1 : 0;
}

/** Copies the wall-clock time from `time` onto the calendar day of `day`. */
export function withTime(day: Date, time: Date | null): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), time?.getHours() ?? 0, time?.getMinutes() ?? 0);
}

/** "Jan 11, 2026": trigger format for DateRangePicker. */
export function fmtMedium(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "20 Aug 2026": trigger format for DateTimeField. */
export function fmtDayMonthYear(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** "10:00": 24h clock (Africa/Lusaka convention). */
export function fmtTime24(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function isDisabledDay(day: Date, minDate?: Date | null, maxDate?: Date | null): boolean {
  if (minDate && compareDay(day, minDate) < 0) return true;
  if (maxDate && compareDay(day, maxDate) > 0) return true;
  return false;
}

/** 6 rows × 7 columns, Sunday-first, padded with out-of-month days. */
function buildMonthCells(month: Date): Date[] {
  const first = startOfMonth(month);
  const lead = first.getDay(); /* 0 = Sunday */
  const cells: Date[] = [];
  for (let i = 0; i < 42; i += 1) cells.push(addDays(first, i - lead));
  return cells;
}

/* ------------------------------------------------------------------ */
/* Month header icon buttons                                           */
/* ------------------------------------------------------------------ */

function NavButton({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className="ui-cal__nav"
      aria-label={label}
      onClick={onClick}
      style={{ border: `1px solid ${T.ghostBorder}`, borderRadius: T.radiusSm, background: T.white, color: T.textPrimary }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
      onMouseLeave={(e) => (e.currentTarget.style.background = T.white)}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* CalendarGrid                                                        */
/* ------------------------------------------------------------------ */

export interface CalendarGridProps {
  /** Any day inside the month to display. */
  month: Date;
  onMonthChange: (month: Date) => void;
  /** Days rendered with the yellow selected fill. */
  selected: Date[];
  /** Inclusive day range rendered with the activeFill. */
  range?: { from: Date; to: Date } | null;
  /** Day currently under keyboard focus (roving tabIndex). */
  focusDay: Date;
  onFocusDay: (day: Date) => void;
  onSelect: (day: Date) => void;
  onHoverDay?: (day: Date | null) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
  /** Hide prev / next arrows (used for the paired grids in DateRangePicker). */
  hidePrev?: boolean;
  hideNext?: boolean;
  /** Focus the roving cell as soon as the grid mounts. */
  autoFocus?: boolean;
  ariaLabel?: string;
}

export function CalendarGrid({
  month, onMonthChange, selected, range, focusDay, onFocusDay, onSelect, onHoverDay, minDate, maxDate, hidePrev, hideNext, autoFocus, ariaLabel,
}: CalendarGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());
  const cells = buildMonthCells(month);
  /* The roving tab stop: the focused day if visible, else the 1st of the month. */
  const tabStop = isSameMonth(focusDay, month) ? focusDay : startOfMonth(month);
  const pendingFocus = useRef(false);

  /* Focus the cell for focusDay wherever it renders (a sibling grid in a
   * two-month pair may own it); fall back to this grid's roving stop. */
  const focusCell = useCallback(() => {
    const root = gridRef.current?.closest<HTMLElement>('[role="dialog"]') ?? gridRef.current;
    const target = root?.querySelector<HTMLButtonElement>('[data-focusday="true"]')
      ?? gridRef.current?.querySelector<HTMLButtonElement>('[data-roving="true"]');
    target?.focus();
  }, []);

  useEffect(() => {
    if (autoFocus) focusCell();
  }, [autoFocus, focusCell]);

  /* After an arrow-key move (possibly into another month) re-focus the new cell. */
  useEffect(() => {
    if (pendingFocus.current) {
      pendingFocus.current = false;
      focusCell();
    }
  }, [focusDay, month, focusCell]);

  const move = (next: Date) => {
    pendingFocus.current = true;
    onFocusDay(next);
    if (!isSameMonth(next, month)) onMonthChange(startOfMonth(next));
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); move(addDays(tabStop, -1)); break;
      case 'ArrowRight': e.preventDefault(); move(addDays(tabStop, 1)); break;
      case 'ArrowUp': e.preventDefault(); move(addDays(tabStop, -7)); break;
      case 'ArrowDown': e.preventDefault(); move(addDays(tabStop, 7)); break;
      case 'Home': e.preventDefault(); move(addDays(tabStop, -tabStop.getDay())); break;
      case 'End': e.preventDefault(); move(addDays(tabStop, 6 - tabStop.getDay())); break;
      case 'PageUp': e.preventDefault(); move(new Date(tabStop.getFullYear(), tabStop.getMonth() - 1, Math.min(tabStop.getDate(), 28))); break;
      case 'PageDown': e.preventDefault(); move(new Date(tabStop.getFullYear(), tabStop.getMonth() + 1, Math.min(tabStop.getDate(), 28))); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isDisabledDay(tabStop, minDate, maxDate)) onSelect(tabStop);
        break;
      default:
    }
  };

  const label = `${MONTH_LONG[month.getMonth()]} ${month.getFullYear()}`;

  return (
    <div className="ui-cal" role="group" aria-label={ariaLabel ?? label}>
      <div className="ui-cal__header">
        {hidePrev ? <span className="ui-cal__nav-spacer" /> : (
          <NavButton label="Previous month" onClick={() => onMonthChange(addMonths(month, -1))}><ChevronLeft size={16} /></NavButton>
        )}
        <span className="ui-cal__title" style={{ color: T.textPrimary }} aria-live="polite">{label}</span>
        {hideNext ? <span className="ui-cal__nav-spacer" /> : (
          <NavButton label="Next month" onClick={() => onMonthChange(addMonths(month, 1))}><ChevronRight size={16} /></NavButton>
        )}
      </div>
      <div className="ui-cal__weekdays" aria-hidden="true">
        {WEEKDAYS.map((w) => <span key={w} className="ui-cal__weekday" style={{ color: T.textSecondary }}>{w}</span>)}
      </div>
      <div ref={gridRef} className="ui-cal__grid" role="grid" onKeyDown={onKeyDown} onMouseLeave={() => onHoverDay?.(null)}>
        {cells.map((day) => {
          const inMonth = isSameMonth(day, month);
          const disabled = isDisabledDay(day, minDate, maxDate);
          const isSelected = selected.some((s) => isSameDay(s, day));
          const inRange = !!range && compareDay(day, range.from) >= 0 && compareDay(day, range.to) <= 0;
          const isToday = isSameDay(day, today);
          const isRoving = isSameDay(day, tabStop);
          const muted = !inMonth || disabled;
          const style: CSSProperties = {
            borderRadius: T.radiusSm,
            color: isSelected ? T.navy : muted ? T.textSecondary : T.textPrimary,
            fontWeight: isSelected ? 600 : 400,
            background: isSelected ? T.yellow : inRange ? T.activeFill : 'transparent',
            boxShadow: isToday && !isSelected ? `inset 0 0 0 1px ${T.ghostBorder}` : undefined,
            opacity: muted ? 0.5 : 1,
          };
          return (
            <button
              key={day.getTime()}
              type="button"
              role="gridcell"
              className="ui-cal__day"
              data-roving={isRoving ? 'true' : undefined}
              data-focusday={inMonth && isSameDay(day, focusDay) ? 'true' : undefined}
              tabIndex={isRoving ? 0 : -1}
              aria-selected={isSelected}
              aria-label={`${day.getDate()} ${MONTH_LONG[day.getMonth()]} ${day.getFullYear()}`}
              aria-current={isToday ? 'date' : undefined}
              disabled={disabled}
              style={style}
              onClick={() => { onFocusDay(day); onSelect(day); }}
              onMouseEnter={(e) => {
                onHoverDay?.(day);
                if (!isSelected && !inRange && !disabled) e.currentTarget.style.background = T.offWhite;
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !inRange) e.currentTarget.style.background = 'transparent';
              }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trigger (GhostButton-styled field)                                  */
/* ------------------------------------------------------------------ */

export interface PickerTriggerProps {
  text: string;
  placeholder: string;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
  /** Stretch to the container width (form fields); default is content-width. */
  block?: boolean;
}

export function PickerTrigger({ text, placeholder, open, onToggle, disabled, invalid, ariaLabel, buttonRef, block }: PickerTriggerProps) {
  const empty = text.length === 0;
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`ui-picker__trigger${block ? ' ui-picker__trigger--block' : ''}`}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onToggle}
      style={{
        border: `1px solid ${invalid ? T.destructive : T.ghostBorder}`,
        borderRadius: T.radiusSm,
        background: T.white,
        color: empty ? T.textSecondary : T.textPrimary,
      }}
    >
      <Calendar size={16} style={{ color: T.textSecondary }} aria-hidden="true" />
      <span className="ui-picker__trigger-text">{empty ? placeholder : text}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Read-only date field (popover footer)                               */
/* ------------------------------------------------------------------ */

export function ReadOnlyDateField({ value, ariaLabel }: { value: string; ariaLabel: string }) {
  return (
    <span
      className="ui-picker__readonly"
      role="status"
      aria-label={ariaLabel}
      style={{ background: T.offWhite, borderRadius: T.radiusSm, color: value ? T.textPrimary : T.textSecondary }}
    >
      {value || '·'}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Media query hook (single month / preset select below 1024px)        */
/* ------------------------------------------------------------------ */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- sync from the live media query on mount */
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

/* ------------------------------------------------------------------ */
/* Popover (portal, anchored below the trigger, focus-trapped)         */
/* ------------------------------------------------------------------ */

const VIEWPORT_MARGIN = 16;
const ANCHOR_GAP = 4;
const FOCUSABLE = 'button:not([disabled]):not([tabindex="-1"]), [href], input:not([disabled]), select:not([disabled]), [tabindex="0"]';

export interface PickerPopoverProps {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
}

export function PickerPopover({ open, anchorRef, onClose, ariaLabel, children }: PickerPopoverProps) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- client-only portal gate */
    setMounted(true);
  }, []);

  /* Anchor below the trigger, clamped to the viewport; flips above when it would overflow. */
  const place = useCallback(() => {
    const anchor = anchorRef.current?.getBoundingClientRect();
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = anchor.bottom + ANCHOR_GAP;
    if (top + height > vh - VIEWPORT_MARGIN && anchor.top - ANCHOR_GAP - height >= VIEWPORT_MARGIN) top = anchor.top - ANCHOR_GAP - height;
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, Math.max(VIEWPORT_MARGIN, vh - height - VIEWPORT_MARGIN)));
    const left = Math.max(VIEWPORT_MARGIN, Math.min(anchor.left, Math.max(VIEWPORT_MARGIN, vw - width - VIEWPORT_MARGIN)));
    setPos({ top, left });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open || !mounted) return;
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, mounted, place]);

  /* Escape closes; outside pointer-down closes; Tab is trapped inside. */
  useEffect(() => {
    if (!open || !mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) { e.preventDefault(); first.focus(); }
    };
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, mounted, onClose, anchorRef]);

  /* Return focus to the trigger when the popover closes. */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) anchorRef.current?.focus();
    wasOpen.current = open;
  }, [open, anchorRef]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="ui-picker__popover"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={{
        top: pos?.top ?? VIEWPORT_MARGIN,
        left: pos?.left ?? VIEWPORT_MARGIN,
        visibility: pos ? 'visible' : 'hidden',
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusMd,
        boxShadow: T.shadowRaise,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
