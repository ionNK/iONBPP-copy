'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useCountry, ALL_COUNTRIES } from '@/context/CountryContext';

export default function CountrySwitcher() {
  const { allowedCountries, canViewAll, selected, setSelected, selectedCountry } = useCountry();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const label = selectedCountry ? selectedCountry.name : 'All Countries';
  const icon = selectedCountry ? <span className="flag">{selectedCountry.flag}</span> : <Globe size={16} />;

  const pick = (scope: string) => {
    setSelected(scope);
    setOpen(false);
  };

  return (
    <div className="country-switcher" ref={ref}>
      <button
        className="cs-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {icon}
        <span className="cs-label">{label}</span>
        <ChevronDown size={14} className={`cs-chev ${open ? 'up' : ''}`} />
      </button>

      {open && (
        <div className="cs-menu" role="listbox">
          <p className="cs-section">Market</p>

          {canViewAll && (
            <button
              className={`cs-item ${selected === ALL_COUNTRIES ? 'active' : ''}`}
              onClick={() => pick(ALL_COUNTRIES)}
              role="option"
              aria-selected={selected === ALL_COUNTRIES}
            >
              <span className="cs-item-ico"><Globe size={15} /></span>
              <span className="cs-item-name">All Countries</span>
              <span className="cs-item-sub">Aggregate</span>
              {selected === ALL_COUNTRIES && <Check size={15} className="cs-check" />}
            </button>
          )}

          {allowedCountries.map((c) => (
            <button
              key={c.code}
              className={`cs-item ${selected === c.code ? 'active' : ''}`}
              onClick={() => pick(c.code)}
              role="option"
              aria-selected={selected === c.code}
            >
              <span className="cs-item-ico flag">{c.flag}</span>
              <span className="cs-item-name">{c.name}</span>
              <span className="cs-item-sub">{c.currency}</span>
              {selected === c.code && <Check size={15} className="cs-check" />}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .country-switcher { position: relative; }
        .cs-trigger {
          display: flex; align-items: center; gap: 8px;
          background: var(--color-bg-input);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
          padding: 8px 12px; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-weight: 600;
          transition: border-color 0.2s, background 0.2s;
        }
        .cs-trigger:hover { border-color: var(--color-betika-yellow); }
        .cs-label { white-space: nowrap; }
        .flag { font-size: 15px; line-height: 1; }
        .cs-chev { color: var(--color-text-secondary); transition: transform 0.2s; }
        .cs-chev.up { transform: rotate(180deg); }

        .cs-menu {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 240px; background: var(--color-bg-panel);
          border: 1px solid var(--color-border); border-radius: 12px;
          box-shadow: var(--shadow-lg, 0 12px 32px rgba(0,0,0,0.25));
          padding: 8px; z-index: 60;
        }
        .cs-section {
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--color-text-muted); margin: 4px 8px 6px; font-weight: 700;
        }
        .cs-item {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 8px; border: none;
          background: transparent; cursor: pointer; color: var(--color-text-primary);
          font-size: 13px; text-align: left;
        }
        .cs-item:hover { background: var(--color-bg-input); }
        .cs-item.active { background: var(--color-bg-input); }
        .cs-item-ico {
          width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
          color: var(--color-text-secondary);
        }
        .cs-item-name { flex: 1; font-weight: 600; }
        .cs-item-sub { font-size: 11px; color: var(--color-text-muted); }
        .cs-check { color: var(--color-betika-green, #22c55e); margin-left: 4px; }

        @media (max-width: 768px) {
          .cs-label { display: none; }
        }
      `}</style>
    </div>
  );
}
