/**
 * Bulk Award Upload (PROTOTYPE) — batch store and mock award engine.
 *
 * Batches persist in localStorage (`bulk-award:batches`). Submitting a batch
 * either awards it immediately (mock: every 50th accepted row is rejected
 * with "wallet_unavailable" so the rejects download is non-empty on large
 * files) or parks it as pending approval when a threshold is hit, pushing an
 * item into the Governance approvals source (mockApprovals.ts stub). Each
 * batch also carries its SMS configuration and a generated recipient list.
 */

import { toCsv } from './parseCsv';
import { formatMoney } from './markets';
import type { MarketCode } from './markets';
import type { ValidatedRow } from './validate';
import { pushApproval } from './mockApprovals';

export const BATCHES_KEY = 'bulk-award:batches';
export const APPROVAL_THRESHOLDS = { totalFreebet: 10000, rows: 1000 } as const;
/** Mock award engine: every Nth accepted row fails with wallet_unavailable. */
export const MOCK_REJECT_EVERY = 50;
export const DEMO_OPERATOR = 'demo.operator';

export type ExpiryUnit = 'hours' | 'days';
export type BatchStatus = 'awarded' | 'pending_approval' | 'rejected';

export type AwardType = 'cash' | 'freebet' | 'bonus';
export const AWARD_TYPES: { value: AwardType; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'freebet', label: 'FreeBet' },
  { value: 'bonus', label: 'Bonus' },
];
export const AWARD_LABEL: Record<AwardType, string> = { cash: 'Cash', freebet: 'FreeBet', bonus: 'Bonus' };

export type RelativeExpiry = { mode: 'relative'; value: number; unit: ExpiryUnit };
/** `iso` is a wall-clock "YYYY-MM-DDTHH:mm" read in GMT. */
export type AbsoluteExpiry = { mode: 'absolute'; iso: string; tz: 'GMT' };
export type Expiry = RelativeExpiry | AbsoluteExpiry;

export interface AwardTerms {
  minOdds?: number;
  maxWin?: number;
  rolloverMultiplier?: number;
}

export type SmsMethod = 'manual' | 'automated';
export interface SmsConfig {
  /** Template with {amount} and {expiry} placeholders. */
  message: string;
  method: SmsMethod;
  /** Person sending the SMS when method is manual. */
  owner?: string;
  /** customerId/msisdn, amount, expiry, rendered message — one row per accepted award. */
  recipientsCsv: string;
}

export const DEFAULT_SMS_MESSAGE = 'Congratulations! {amount} has been credited to your account. Use it before {expiry}.';
/** Cash has no expiry, so the default template drops the {expiry} sentence. */
export const DEFAULT_SMS_MESSAGE_CASH = 'Congratulations! {amount} cash has been credited to your account.';

export interface BatchDetails {
  name: string;
  reference: string;
  market: MarketCode;
  currency: string;
  awardType: AwardType;
  /** null for cash awards (no expiry). */
  expiry: Expiry | null;
  terms?: AwardTerms;
  sms: SmsConfig;
  description?: string;
}

export interface Batch extends BatchDetails {
  id: string;
  createdAt: string;
  createdBy: typeof DEMO_OPERATOR;
  /** Rows submitted (valid + warning; validation errors are excluded before submit). */
  rowCount: number;
  accepted: number;
  rejected: number;
  /** Total award amount (name kept from the FreeBet-only prototype for the approvals shape). */
  totalFreebet: number;
  /** Sum of units when the file carried a units column. */
  totalUnits: number | null;
  status: BatchStatus;
  /** Original columns + "reason" for every rejected row (validation errors + award failures). */
  rejectsCsv: string;
}

/** Batches stored before award types / SMS existed are hydrated to the current shape. */
function hydrate(raw: Partial<Batch> & { expiry?: (Partial<Expiry> & { value?: number; unit?: ExpiryUnit }) | null }): Batch {
  const awardType = raw.awardType ?? 'freebet';
  let expiry: Expiry | null;
  if (raw.expiry === null && awardType === 'cash') expiry = null;
  else if (raw.expiry && 'mode' in raw.expiry && raw.expiry.mode === 'absolute') expiry = raw.expiry as AbsoluteExpiry;
  else expiry = { mode: 'relative', value: raw.expiry?.value ?? 7, unit: raw.expiry?.unit ?? 'days' };
  return {
    ...(raw as Batch),
    awardType,
    expiry,
    totalUnits: raw.totalUnits ?? null,
    sms: raw.sms ?? { message: DEFAULT_SMS_MESSAGE, method: 'automated', recipientsCsv: '' },
  };
}

function read(): Batch[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(BATCHES_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as Batch[]).map(hydrate) : [];
  } catch {
    return [];
  }
}

function write(batches: Batch[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
  } catch {
    /* Prototype mock: storage failures are non-fatal. */
  }
}

/** Newest first. */
export function listBatches(): Batch[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBatch(id: string): Batch | undefined {
  return read().find((b) => b.id === id);
}

export function requiresApproval(totalFreebet: number, validRowCount: number): boolean {
  return totalFreebet > APPROVAL_THRESHOLDS.totalFreebet || validRowCount > APPROVAL_THRESHOLDS.rows;
}

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export interface SubmitInput {
  /** Batch details; `sms.recipientsCsv` is generated here from the accepted rows. */
  details: Omit<BatchDetails, 'sms'> & { sms: Omit<SmsConfig, 'recipientsCsv'> };
  /** File header row, in original order. */
  headers: string[];
  /** All validated rows (errors included; they are excluded from awards and listed in the rejects CSV). */
  rows: ValidatedRow[];
  /** Sum of units from validation (null when the file has no units column). */
  totalUnits?: number | null;
}

/** Substitute {amount} and {expiry} in the SMS template. */
export function renderSmsMessage(template: string, amount: string, expiry: string): string {
  return template.replace(/\{amount\}/g, amount).replace(/\{expiry\}/g, expiry);
}

/** SMS recipient list for the accepted rows: customerId/msisdn, amount, expiry, rendered message. */
export function buildRecipientsCsv(details: SubmitInput['details'], accepted: ValidatedRow[]): string {
  const expiryText = details.expiry ? formatExpiry(details.expiry) : 'n/a';
  const lines = accepted.map((r) => {
    const amount = formatMoney(r.amount, details.currency);
    return [r.msisdn || r.customerId, amount, expiryText, renderSmsMessage(details.sms.message, amount, expiryText)];
  });
  return toCsv([['customer', 'amount', 'expiry', 'message'], ...lines]);
}

export function submitBatch({ details, headers, rows, totalUnits = null }: SubmitInput): Batch {
  const accepted = rows.filter((r) => r.status !== 'error');
  const errors = rows.filter((r) => r.status === 'error');
  const totalFreebet = Math.round(accepted.reduce((s, r) => s + r.amount, 0) * 100) / 100;
  const approvalRequired = requiresApproval(totalFreebet, accepted.length);

  const rejects: string[][] = errors.map((r) => [...r.cells, r.messages.join('; ')]);
  let awarded = accepted.length;
  let failed = 0;
  const failedLines = new Set<number>();

  if (!approvalRequired) {
    accepted.forEach((r, i) => {
      if ((i + 1) % MOCK_REJECT_EVERY === 0) {
        rejects.push([...r.cells, 'wallet_unavailable']);
        failedLines.add(r.line);
        failed += 1;
      }
    });
    awarded = accepted.length - failed;
  }

  /* SMS recipients: every award that was (or, pending approval, will be) credited. */
  const recipients = accepted.filter((r) => !failedLines.has(r.line));

  const batch: Batch = {
    ...details,
    sms: { ...details.sms, recipientsCsv: buildRecipientsCsv(details, recipients) },
    id: newId('BA'),
    createdAt: new Date().toISOString(),
    createdBy: DEMO_OPERATOR,
    rowCount: accepted.length,
    accepted: approvalRequired ? 0 : awarded,
    rejected: errors.length + failed,
    totalFreebet,
    totalUnits,
    status: approvalRequired ? 'pending_approval' : 'awarded',
    rejectsCsv: toCsv([[...headers, 'reason'], ...rejects]),
  };

  write([batch, ...read()]);

  if (approvalRequired) {
    pushApproval({
      id: newId('AP'),
      type: 'bulk_freebet_award',
      batchId: batch.id,
      name: batch.name,
      reference: batch.reference,
      totalFreebet: batch.totalFreebet,
      currency: batch.currency,
      rowCount: batch.rowCount,
      status: 'pending',
      createdAt: batch.createdAt,
      createdBy: DEMO_OPERATOR,
    });
  }

  return batch;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parse the absolute expiry wall-clock string as a GMT instant; null when malformed. */
export function parseAbsoluteExpiry(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "4 Jun 2026, 23:59 GMT". */
export function formatAbsoluteExpiry(iso: string): string {
  const d = parseAbsoluteExpiry(iso);
  if (!d) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} GMT`;
}

/** Relative phrasing for an absolute expiry, e.g. "in 254 days" / "in 5 hours" / "expired". */
export function relativeExpiryLabel(iso: string, now: Date = new Date()): string {
  const d = parseAbsoluteExpiry(iso);
  if (!d) return '';
  const ms = d.getTime() - now.getTime();
  if (ms <= 0) return 'expired';
  const hours = Math.round(ms / 3_600_000);
  if (hours < 48) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.round(ms / 86_400_000);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

/** Short expiry text: "7 days" for relative, "4 Jun 2026, 23:59 GMT" for absolute. */
export function formatExpiry(expiry: Expiry): string {
  if (expiry.mode === 'absolute') return formatAbsoluteExpiry(expiry.iso);
  const unit = expiry.value === 1 ? expiry.unit.slice(0, -1) : expiry.unit;
  return `${expiry.value} ${unit}`;
}
