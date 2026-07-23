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
    </div>
  );
}
