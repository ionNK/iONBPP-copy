'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { FIELD_DEFS, FIELD_GROUPS, fieldDef, FieldDef } from '@/data/segments';
import styles from './FieldPicker.module.css';

/**
 * Searchable, grouped, keyboard-navigable field selector for the Segment
 * Builder. Replaces the native <select> which becomes unusable once the
 * attribute catalogue grows to 80+ fields across many groups.
 *
 * UX affordances:
 *  - Type-to-filter across label, key and description.
 *  - Sticky group headers so the user keeps context while scrolling.
 *  - Full keyboard support: ↑/↓ to move, Enter to select, Esc to close,
 *    typing focuses the search box automatically.
 *  - Field type badge + help text subtitle for scannability.
 *  - Click-outside / blur to dismiss.
 */

const TYPE_BADGE: Record<FieldDef['type'], string> = {
  number: '#',
  string: 'Aa',
  enum: '≡',
  boolean: '0/1',
  date: '📅',
};

export default function FieldPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (field: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = fieldDef(value);

  // Flat, filtered + grouped result set. We keep a flat list for keyboard
  // navigation and derive the grouped rendering from it.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (f: FieldDef) =>
      !q ||
      f.label.toLowerCase().includes(q) ||
      f.key.toLowerCase().includes(q) ||
      (f.description?.toLowerCase().includes(q) ?? false) ||
      f.group.toLowerCase().includes(q);
    return FIELD_DEFS.filter(match);
  }, [query]);

  const grouped = useMemo(() => {
    return FIELD_GROUPS
      .map((g) => ({ group: g, items: filtered.filter((f) => f.group === g) }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  // Clamp the active index whenever the result set changes.
  useEffect(() => {
    setActiveIdx((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Focus the search box when opening.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(Math.max(0, filtered.findIndex((f) => f.key === value)));
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  const commit = (f: FieldDef) => {
    onChange(f.key);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const f = filtered[activeIdx];
      if (f) commit(f);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.triggerLabel}>
          {selected ? (
            <>
              <span className={styles.triggerGroup}>{selected.group}</span>
              <span>{selected.label}</span>
            </>
          ) : (
            <span className={styles.placeholder}>Select a field…</span>
          )}
        </span>
        <ChevronDown size={15} className={`${styles.chev} ${open ? styles.chevOpen : ''}`} />
      </button>

      {open && (
        <div className={styles.pop} role="listbox">
          <div className={styles.searchRow}>
            <Search size={14} className={styles.searchIcon} />
            <input
              ref={inputRef}
              className={styles.search}
              placeholder="Search attributes…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
              onKeyDown={onKeyDown}
            />
          </div>

          <div className={styles.list} ref={listRef}>
            {grouped.length === 0 ? (
              <div className={styles.empty}>No attributes match “{query}”.</div>
            ) : (
              grouped.map(({ group, items }) => (
                <div key={group} className={styles.group}>
                  <div className={styles.groupHead}>{group}</div>
                  {items.map((f) => {
                    const flatIdx = filtered.indexOf(f);
                    const isActive = flatIdx === activeIdx;
                    const isSelected = f.key === value;
                    return (
                      <button
                        type="button"
                        key={f.key}
                        role="option"
                        aria-selected={isSelected}
                        data-active={isActive}
                        className={`${styles.opt} ${isActive ? styles.optActive : ''}`}
                        onMouseEnter={() => setActiveIdx(flatIdx)}
                        onClick={() => commit(f)}
                      >
                        <span className={styles.badge}>{TYPE_BADGE[f.type]}</span>
                        <span className={styles.optBody}>
                          <span className={styles.optLabel}>{f.label}</span>
                          {f.description && <span className={styles.optDesc}>{f.description}</span>}
                        </span>
                        {isSelected && <Check size={14} className={styles.tick} />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className={styles.hint}>
            <kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>↵</kbd> select · <kbd>esc</kbd> close
          </div>
        </div>
      )}
    </div>
  );
}