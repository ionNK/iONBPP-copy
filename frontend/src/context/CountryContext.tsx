'use client';

// Country / market scoping for the CRM.
// The platform operates across 7 markets. Access is permission-gated per user:
// an operator only sees the countries they are entitled to.
// For now we run as a SUPER ADMIN account, which has access to ALL countries
// plus the aggregate "All Countries" view.

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export interface Country {
  code: string;   // ISO-ish short code used for scoping
  name: string;   // Display name (must match Player.country values)
  flag: string;   // Emoji flag for quick visual scanning
  currency: string;
}

// The 7 operating markets.
export const COUNTRIES: Country[] = [
  { code: 'KE', name: 'Kenya',    flag: '🇰🇪', currency: 'KES' },
  { code: 'GH', name: 'Ghana',    flag: '🇬🇭', currency: 'GHS' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', currency: 'TZS' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', currency: 'ETB' },
  { code: 'NG', name: 'Nigeria',  flag: '🇳🇬', currency: 'NGN' },
  { code: 'UG', name: 'Uganda',   flag: '🇺🇬', currency: 'UGX' },
  { code: 'ZM', name: 'Zambia',   flag: '🇿🇲', currency: 'ZMW' },
];

// Sentinel used by the super-admin aggregate view.
export const ALL_COUNTRIES = 'ALL';

export type CountryScope = string; // a country code, or ALL_COUNTRIES

// User role model. Only the super admin gets the aggregate view + every market.
export type AdminRole = 'super_admin' | 'country_admin';

interface CountryContextValue {
  role: AdminRole;
  /** Countries this user is permitted to see. */
  allowedCountries: Country[];
  /** Whether the user may use the aggregate "All Countries" view. */
  canViewAll: boolean;
  /** Currently selected scope (a country code or ALL). */
  selected: CountryScope;
  setSelected: (scope: CountryScope) => void;
  /** Resolved Country object for the current selection, or null for the aggregate view. */
  selectedCountry: Country | null;
  /**
   * True if a record belonging to `countryName` is visible under the current
   * selection AND the user's permissions.
   */
  isInScope: (countryName: string) => boolean;
}

const CountryContext = createContext<CountryContextValue | undefined>(undefined);

const STORAGE_KEY = 'crm_country_scope';

// --- Current session ---------------------------------------------------------
// For now the app runs as a SUPER ADMIN with access to every market.
// When real auth lands, derive `role` + `allowedCodes` from the session/JWT.
const SESSION_ROLE: AdminRole = 'super_admin';
const SESSION_ALLOWED_CODES: string[] | 'all' = 'all';

export function CountryProvider({ children }: { children: ReactNode }) {
  const role = SESSION_ROLE;

  const allowedCountries = useMemo(() => {
    if (SESSION_ALLOWED_CODES === 'all') return COUNTRIES;
    return COUNTRIES.filter((c) => SESSION_ALLOWED_CODES.includes(c.code));
  }, []);

  const canViewAll = role === 'super_admin';

  const defaultScope: CountryScope = canViewAll
    ? ALL_COUNTRIES
    : allowedCountries[0]?.code ?? ALL_COUNTRIES;

  const [selected, setSelectedState] = useState<CountryScope>(defaultScope);

  // Restore persisted selection (if still permitted).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const isValid =
        (saved === ALL_COUNTRIES && canViewAll) ||
        allowedCountries.some((c) => c.code === saved);
      if (isValid) setSelectedState(saved);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSelected = (scope: CountryScope) => {
    setSelectedState(scope);
    try {
      localStorage.setItem(STORAGE_KEY, scope);
    } catch {
      /* ignore */
    }
  };

  const selectedCountry = useMemo(
    () => (selected === ALL_COUNTRIES ? null : COUNTRIES.find((c) => c.code === selected) ?? null),
    [selected],
  );

  const isInScope = useMemo(() => {
    return (countryName: string) => {
      // Must be within the user's permissions first.
      const permitted =
        SESSION_ALLOWED_CODES === 'all' ||
        allowedCountries.some((c) => c.name === countryName);
      if (!permitted) return false;

      if (selected === ALL_COUNTRIES) return true;
      const sel = COUNTRIES.find((c) => c.code === selected);
      return sel ? sel.name === countryName : true;
    };
  }, [selected, allowedCountries]);

  const value: CountryContextValue = {
    role,
    allowedCountries,
    canViewAll,
    selected,
    setSelected,
    selectedCountry,
    isInScope,
  };

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry must be used within a CountryProvider');
  return ctx;
}
