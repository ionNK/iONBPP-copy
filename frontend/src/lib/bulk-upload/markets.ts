/**
 * Bulk FreeBet Upload (PROTOTYPE) — supported markets and MSISDN
 * normalisation. Light integrity only: format, not eligibility.
 */

export type MarketCode = 'GH' | 'TZ';

export interface Market {
  code: MarketCode;
  label: string;
  currency: string;
  /** International dialling code without "+". */
  countryCode: string;
  /** Digits in the national (subscriber) number, excluding the trunk "0". */
  nationalLength: number;
}

export const MARKETS: Record<MarketCode, Market> = {
  GH: { code: 'GH', label: 'Ghana', currency: 'GHS', countryCode: '233', nationalLength: 9 },
  TZ: { code: 'TZ', label: 'Tanzania', currency: 'TZS', countryCode: '255', nationalLength: 9 },
};

export const MARKET_CODES: MarketCode[] = ['GH', 'TZ'];

export function isMarketCode(value: string): value is MarketCode {
  return value === 'GH' || value === 'TZ';
}

export interface NormalisedMsisdn {
  /** Canonical international form (country code + national number, no "+"). */
  value: string;
  ok: boolean;
  reason?: string;
}

/**
 * Strips spaces, dashes, "+" and a leading trunk "0", prefixes the market
 * country code when missing, then checks the result is exactly
 * countryCode + nationalLength digits.
 */
export function normaliseMsisdn(raw: string, market: Market): NormalisedMsisdn {
  let digits = raw.replace(/[\s\-().]/g, '').replace(/^\+/, '');
  if (digits === '') return { value: '', ok: false, reason: 'msisdn is empty' };
  if (!/^\d+$/.test(digits)) return { value: digits, ok: false, reason: 'msisdn contains non-digits' };

  /* "00233…" international prefix → "233…". */
  if (digits.startsWith('00' + market.countryCode)) digits = digits.slice(2);

  if (!digits.startsWith(market.countryCode)) {
    /* Leading trunk zero(s) belong to the national format only. */
    digits = digits.replace(/^0+/, '');
    digits = market.countryCode + digits;
  }

  const expected = market.countryCode.length + market.nationalLength;
  if (digits.length !== expected) {
    return { value: digits, ok: false, reason: `msisdn must be ${market.nationalLength} national digits for ${market.code}` };
  }
  return { value: digits, ok: true };
}

/** Domain-convention masking, e.g. 233241••••567 (first 6 + last 3 shown). */
export function maskMsisdn(value: string): string {
  if (value.length <= 9) return value;
  return `${value.slice(0, 6)}••••${value.slice(-3)}`;
}

/** Currency formatting for summaries, e.g. "GHS 1,250.00". */
export function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
