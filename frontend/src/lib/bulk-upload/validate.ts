/**
 * Bulk Award Upload (PROTOTYPE) — light integrity checks on a parsed CSV.
 *
 * File-level: headers are resolved to canonical fields (columnMap.ts); a
 * missing mandatory field after mapping is `unmapped_fields`, which sends the
 * stepper to the "Map columns" step. Row-level: customerId present (MSISDNs
 * normalised, profile ids accepted as-is), amount a positive number, units a
 * positive integer when present, duplicate detection, turnover numeric when
 * present. Deliberately NO business eligibility, NO reference validation, NO
 * amount cap: the upload IS the campaign and the winners are pre-determined
 * offline.
 */

import { normaliseHeader } from './parseCsv';
import type { ParsedCsv } from './parseCsv';
import { normaliseMsisdn } from './markets';
import type { Market } from './markets';
import { MSISDN_ALIASES, applyOverrides, autoMap, looksLikeMsisdn } from './columnMap';
import type { CanonicalField, ColumnMapping, MappingOverrides } from './columnMap';

/** Canonical header spellings for the blank template download. */
export const CSV_HEADERS = ['profile_id', 'msisdn', 'bet_id', 'Cash Turnover', 'amount', 'units'] as const;

/** Template marker row: every cell is "Mandatory" or empty (see tests/fixtures/bulk-upload/tz-template.csv). */
export const MARKER_TOKEN = 'mandatory';

export type RowStatus = 'valid' | 'warning' | 'error';

export interface ValidatedRow {
  /** 1-based data-row index (header excluded, marker rows included). */
  line: number;
  status: RowStatus;
  messages: string[];
  /** Original cells in file column order (used for the rejects CSV). */
  cells: string[];
  customerIdRaw: string;
  /** Canonical customer key: normalised MSISDN or the profile id as written. */
  customerId: string;
  /** Canonical MSISDN for the SMS recipient list; '' when the file has none / it is invalid. */
  msisdn: string;
  betId: string;
  turnover: string;
  unitsRaw: string;
  /** Parsed units; null when the column is absent, empty or invalid. */
  units: number | null;
  amountRaw: string;
  /** Parsed award amount; 0 when invalid. */
  amount: number;
}

export interface ValidationSummary {
  totalRows: number;
  markerRowsSkipped: number;
  valid: number;
  warning: number;
  error: number;
  uniqueCustomers: number;
  /** Sum of amount over valid + warning rows (errors excluded). Name kept for the stored batch / approvals shape. */
  totalFreebet: number;
  /** Sum of units over valid + warning rows; null when the units field is not mapped. */
  totalUnits: number | null;
  currency: string;
}

export type FileError =
  | { fileError: 'unmapped_fields'; unmapped: CanonicalField[] }
  | { fileError: 'empty_file' };

export interface ValidationResult {
  fileError?: FileError;
  fileWarnings: string[];
  headers: string[];
  /** Effective canonical field → header index (auto map + overrides). */
  mapping: ColumnMapping;
  rows: ValidatedRow[];
  summary: ValidationSummary;
}

export const emptySummary = (currency: string): ValidationSummary => ({
  totalRows: 0,
  markerRowsSkipped: 0,
  valid: 0,
  warning: 0,
  error: 0,
  uniqueCustomers: 0,
  totalFreebet: 0,
  totalUnits: null,
  currency,
});

const isMarkerRow = (cells: string[]) => cells.every((c) => c === '' || c.toLowerCase() === MARKER_TOKEN);

const parseAmount = (raw: string): number | null => {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '' || !/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function validateCsv(parsed: ParsedCsv, market: Market, overrides: MappingOverrides = {}): ValidationResult {
  const currency = market.currency;
  const headers = parsed.headers;
  const fileWarnings: string[] = [];

  if (headers.length === 0) {
    return { fileError: { fileError: 'empty_file' }, fileWarnings, headers, mapping: {}, rows: [], summary: emptySummary(currency) };
  }

  const auto = autoMap(headers);
  const { mapping, unmapped } = applyOverrides(auto, overrides);
  if (unmapped.length > 0) {
    return { fileError: { fileError: 'unmapped_fields', unmapped }, fileWarnings, headers, mapping, rows: [], summary: emptySummary(currency) };
  }

  const used = new Set<number>(Object.values(mapping).filter((i): i is number => i !== undefined));
  const customerIdx = mapping.customerId as number;
  /* Separate msisdn column for the SMS list, unless customerId already is the msisdn column. */
  const msisdnIdx = auto.msisdnIndex !== undefined && auto.msisdnIndex !== customerIdx && !used.has(auto.msisdnIndex) ? auto.msisdnIndex : undefined;
  if (msisdnIdx !== undefined) used.add(msisdnIdx);
  const customerIsMsisdnColumn = MSISDN_ALIASES.includes(normaliseHeader(headers[customerIdx]));

  const unknown = headers.filter((h, i) => h !== '' && !used.has(i));
  if (unknown.length > 0) fileWarnings.push(`Unknown columns ignored: ${unknown.join(', ')}`);

  /* Row messages quote the file's own header names so operators can find the column. */
  const name = (field: CanonicalField) => headers[mapping[field] as number];
  const cell = (cells: string[], i: number | undefined) => (i === undefined ? '' : (cells[i] ?? ''));

  const rows: ValidatedRow[] = [];
  let markerRowsSkipped = 0;
  const seen = new Set<string>();
  const betByCustomer = new Map<string, string>();
  const hasBetId = mapping.betId !== undefined;
  const hasUnits = mapping.units !== undefined;

  parsed.rows.forEach((cells, i) => {
    if (isMarkerRow(cells)) {
      markerRowsSkipped += 1;
      return;
    }
    const messages: string[] = [];
    let status: RowStatus = 'valid';
    const fail = (m: string) => { messages.push(m); status = 'error'; };
    const warn = (m: string) => { messages.push(m); if (status === 'valid') status = 'warning'; };

    const customerIdRaw = cell(cells, customerIdx);
    const betId = cell(cells, mapping.betId);
    const amountRaw = cell(cells, mapping.amount);
    const turnover = cell(cells, mapping.turnover);
    const unitsRaw = cell(cells, mapping.units);

    /* Customer key: MSISDN columns (and phone-shaped values) are normalised; other ids are accepted as-is. */
    let customerId = customerIdRaw;
    let customerOk = customerIdRaw !== '';
    let msisdn = '';
    if (customerIdRaw === '') {
      fail(`${name('customerId')} is empty`);
    } else if (customerIsMsisdnColumn || looksLikeMsisdn(customerIdRaw)) {
      const norm = normaliseMsisdn(customerIdRaw, market);
      if (norm.ok) {
        customerId = norm.value;
        msisdn = norm.value;
      } else {
        customerOk = false;
        fail(norm.reason ?? `${name('customerId')} is invalid`);
      }
    }
    if (msisdnIdx !== undefined) {
      const raw = cell(cells, msisdnIdx);
      if (raw !== '') {
        const norm = normaliseMsisdn(raw, market);
        if (norm.ok) msisdn = norm.value;
        else warn(`${headers[msisdnIdx]} is invalid (excluded from the SMS list)`);
      }
    }

    if (hasBetId && betId === '') fail(`${name('betId')} is empty`);

    const amount = parseAmount(amountRaw);
    if (amount === null) fail(`${name('amount')} is not numeric`);
    else if (amount <= 0) fail(`${name('amount')} must be greater than 0`);

    let units: number | null = null;
    if (hasUnits && unitsRaw !== '') {
      const n = parseAmount(unitsRaw);
      if (n === null || !Number.isInteger(n) || n <= 0) warn(`${name('units')} is not a positive whole number (ignored)`);
      else units = n;
    }

    /* Duplicate detection keys on customerId + betId (customerId alone without a bet column); the first occurrence is untouched. */
    if (customerOk && (!hasBetId || betId !== '')) {
      const key = hasBetId ? `${customerId}|${betId}` : customerId;
      if (seen.has(key)) {
        fail(hasBetId
          ? `Duplicate ${name('customerId')} + ${name('betId')} (already listed earlier in this file)`
          : `Duplicate ${name('customerId')} (already listed earlier in this file)`);
      } else {
        seen.add(key);
        if (hasBetId) {
          const earlier = betByCustomer.get(customerId);
          if (earlier === undefined) betByCustomer.set(customerId, betId);
          else if (earlier !== betId) warn(`Same ${name('customerId')} appears earlier with a different ${name('betId')}`);
        }
      }
    }

    if (turnover !== '' && parseAmount(turnover) === null) warn(`${name('turnover')} is not numeric (ignored)`);

    rows.push({
      line: i + 1,
      status,
      messages,
      cells,
      customerIdRaw,
      customerId,
      msisdn,
      betId,
      turnover,
      unitsRaw,
      units,
      amountRaw,
      amount: amount !== null && amount > 0 ? amount : 0,
    });
  });

  const accepted = rows.filter((r) => r.status !== 'error');
  const summary: ValidationSummary = {
    totalRows: parsed.rows.length,
    markerRowsSkipped,
    valid: rows.filter((r) => r.status === 'valid').length,
    warning: rows.filter((r) => r.status === 'warning').length,
    error: rows.filter((r) => r.status === 'error').length,
    uniqueCustomers: new Set(accepted.map((r) => r.customerId)).size,
    totalFreebet: round2(accepted.reduce((sum, r) => sum + r.amount, 0)),
    totalUnits: hasUnits ? accepted.reduce((sum, r) => sum + (r.units ?? 0), 0) : null,
    currency,
  };

  return { fileWarnings, headers, mapping, rows, summary };
}

/** Header-only CSV for the "Download blank template" link. */
export function blankTemplateCsv(): string {
  return `${CSV_HEADERS.join(',')}\r\n`;
}
