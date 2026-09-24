/**
 * Bulk Award Upload (PROTOTYPE) — header → canonical field mapping.
 *
 * Files arrive with operator-specific headers (profile_id / msisdn /
 * freebetCalculated / "Number of Rounds" …). `autoMap` resolves them to the
 * five canonical fields via alias lists; anything it cannot resolve for a
 * mandatory field is reported so the stepper can show the "Map columns" step.
 */

import { normaliseHeader } from './parseCsv';

export type CanonicalField = 'customerId' | 'amount' | 'units' | 'betId' | 'turnover';

export interface CanonicalFieldDef {
  key: CanonicalField;
  label: string;
  mandatory: boolean;
  /** Human-readable examples of accepted headers (shown as a hint). */
  examples: string;
}

export const CANONICAL_FIELDS: CanonicalFieldDef[] = [
  { key: 'customerId', label: 'Customer ID', mandatory: true, examples: 'profile_id, msisdn, customer_id' },
  { key: 'amount', label: 'Amount', mandatory: true, examples: 'amount, freebetCalculated, award_amount' },
  { key: 'units', label: 'Units', mandatory: false, examples: 'units, Number of Rounds, free_spins' },
  { key: 'betId', label: 'Bet ID', mandatory: false, examples: 'bet_id, ticket_id, coupon_id' },
  { key: 'turnover', label: 'Turnover', mandatory: false, examples: 'Cash Turnover, turnover, stake' },
];

export const MANDATORY_FIELDS: CanonicalField[] = CANONICAL_FIELDS.filter((f) => f.mandatory).map((f) => f.key);

export const fieldDef = (key: CanonicalField): CanonicalFieldDef => CANONICAL_FIELDS.find((f) => f.key === key) as CanonicalFieldDef;

/** Headers that identify a phone-number column (normalised form). */
export const MSISDN_ALIASES = ['msisdn', 'phonenumber', 'phone', 'mobile', 'mobilenumber', 'phoneno', 'mobileno'];

/**
 * Normalised header aliases per canonical field, in order of preference.
 * "profile_id" precedes "msisdn" so a file carrying both keys the customer by
 * profile and keeps the msisdn column for the SMS recipient list.
 */
export const ALIASES: Record<CanonicalField, string[]> = {
  customerId: ['profileid', 'customerid', 'playerid', 'userid', 'accountid', ...MSISDN_ALIASES],
  amount: ['amount', 'freebetcalculated', 'freebetamount', 'freebet', 'awardamount', 'award', 'bonusamount', 'cashamount', 'credit'],
  units: ['units', 'numberofrounds', 'rounds', 'freespins', 'spins', 'quantity', 'qty', 'tokens'],
  betId: ['betid', 'bet', 'ticketid', 'ticket', 'couponid', 'coupon', 'slipid'],
  turnover: ['cashturnover', 'turnover', 'stake', 'totalstake', 'wagered'],
};

/** Canonical field → header index in the file. */
export type ColumnMapping = Partial<Record<CanonicalField, number>>;

/** User overrides from the mapping step; `null` explicitly clears an auto-mapped field. */
export type MappingOverrides = Partial<Record<CanonicalField, number | null>>;

export interface AutoMapResult {
  mapping: ColumnMapping;
  /** Mandatory canonical fields that no header matched. */
  unmapped: CanonicalField[];
  /** Header index of an msisdn column (kept for the SMS list even when customerId is profile_id). */
  msisdnIndex?: number;
  /** Header indices no canonical field claimed. */
  unused: number[];
}

export function autoMap(headers: string[]): AutoMapResult {
  const keys = headers.map(normaliseHeader);
  const mapping: ColumnMapping = {};
  const claimed = new Set<number>();

  CANONICAL_FIELDS.forEach(({ key }) => {
    for (const alias of ALIASES[key]) {
      const i = keys.findIndex((k, idx) => k === alias && !claimed.has(idx));
      if (i !== -1) {
        mapping[key] = i;
        claimed.add(i);
        break;
      }
    }
  });

  const msisdnIndex = keys.findIndex((k) => MSISDN_ALIASES.includes(k));
  if (msisdnIndex !== -1) claimed.add(msisdnIndex);

  return {
    mapping,
    unmapped: MANDATORY_FIELDS.filter((f) => mapping[f] === undefined),
    msisdnIndex: msisdnIndex === -1 ? undefined : msisdnIndex,
    unused: headers.map((_, i) => i).filter((i) => !claimed.has(i) && headers[i] !== ''),
  };
}

/** Merge user overrides onto the auto mapping and recompute the missing mandatory fields. */
export function applyOverrides(auto: AutoMapResult, overrides: MappingOverrides): { mapping: ColumnMapping; unmapped: CanonicalField[] } {
  const mapping: ColumnMapping = { ...auto.mapping };
  (Object.keys(overrides) as CanonicalField[]).forEach((key) => {
    const v = overrides[key];
    if (v === null) delete mapping[key];
    else if (typeof v === 'number') mapping[key] = v;
  });
  return { mapping, unmapped: MANDATORY_FIELDS.filter((f) => mapping[f] === undefined) };
}

/**
 * Heuristic for a customer-ID cell whose source column is not a known msisdn
 * header: a leading "+" or an all-digit value of 9+ digits is treated as a
 * phone number and normalised; anything else (e.g. "GH-1001") is a profile id.
 */
export function looksLikeMsisdn(raw: string): boolean {
  const cleaned = raw.replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('+')) return /^\+\d+$/.test(cleaned);
  return /^\d{9,}$/.test(cleaned);
}
