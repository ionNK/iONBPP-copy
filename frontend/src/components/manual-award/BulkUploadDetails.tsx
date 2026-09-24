'use client';

import { MARKETS, MARKET_CODES, isMarketCode } from '@/lib/bulk-upload/markets';
import type { MarketCode } from '@/lib/bulk-upload/markets';
import { AWARD_LABEL, AWARD_TYPES, DEFAULT_SMS_MESSAGE, DEFAULT_SMS_MESSAGE_CASH, formatAbsoluteExpiry, parseAbsoluteExpiry, relativeExpiryLabel } from '@/lib/bulk-upload/mockBatches';
import type { AwardTerms, AwardType, Expiry, ExpiryUnit, SmsMethod } from '@/lib/bulk-upload/mockBatches';

export type ExpiryPreset = '24h' | '48h' | '7d' | '30d' | 'custom';
export type ExpiryMode = 'relative' | 'absolute';

export const EXPIRY_PRESETS: { value: ExpiryPreset; label: string; expiry?: { value: number; unit: ExpiryUnit } }[] = [
  { value: '24h', label: '24 hours', expiry: { value: 24, unit: 'hours' } },
  { value: '48h', label: '48 hours', expiry: { value: 48, unit: 'hours' } },
  { value: '7d', label: '7 days', expiry: { value: 7, unit: 'days' } },
  { value: '30d', label: '30 days', expiry: { value: 30, unit: 'days' } },
  { value: 'custom', label: 'Custom' },
];

export interface DetailsState {
  name: string;
  reference: string;
  market: MarketCode;
  awardType: AwardType;
  expiryMode: ExpiryMode;
  expiryPreset: ExpiryPreset;
  customValue: string;
  customUnit: ExpiryUnit;
  /** "YYYY-MM-DDTHH:mm" wall-clock in GMT (absolute mode). */
  absoluteIso: string;
  minOdds: string;
  maxWin: string;
  rolloverMultiplier: string;
  smsMessage: string;
  smsMethod: SmsMethod;
  smsOwner: string;
  description: string;
}

export const DEFAULT_DETAILS: DetailsState = {
  name: '',
  reference: '',
  market: 'GH',
  awardType: 'freebet',
  expiryMode: 'relative',
  expiryPreset: '7d',
  customValue: '',
  customUnit: 'days',
  absoluteIso: '',
  minOdds: '',
  maxWin: '',
  rolloverMultiplier: '',
  smsMessage: DEFAULT_SMS_MESSAGE,
  smsMethod: 'automated',
  smsOwner: '',
  description: '',
};

/** Resolved expiry, or null when the custom value / absolute date is missing or invalid. */
export function resolveExpiry(d: DetailsState): Expiry | null {
  if (d.expiryMode === 'absolute') {
    return parseAbsoluteExpiry(d.absoluteIso) ? { mode: 'absolute', iso: d.absoluteIso, tz: 'GMT' } : null;
  }
  const preset = EXPIRY_PRESETS.find((p) => p.value === d.expiryPreset);
  if (preset?.expiry) return { mode: 'relative', ...preset.expiry };
  const n = Number(d.customValue);
  return Number.isInteger(n) && n > 0 ? { mode: 'relative', value: n, unit: d.customUnit } : null;
}

const positive = (raw: string): number | undefined => {
  const n = Number(raw);
  return raw.trim() !== '' && Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Terms for the selected award type; undefined for cash (no terms apply). */
export function resolveTerms(d: DetailsState): AwardTerms | undefined {
  if (d.awardType === 'cash') return undefined;
  const terms: AwardTerms = { minOdds: positive(d.minOdds), maxWin: positive(d.maxWin) };
  if (d.awardType === 'bonus') terms.rolloverMultiplier = positive(d.rolloverMultiplier);
  return terms;
}

/** Cash: name only. FreeBet / Bonus: name + expiry + minOdds + maxWin. Manual SMS additionally needs an owner. */
export function detailsComplete(d: DetailsState): boolean {
  if (d.name.trim() === '') return false;
  if (d.smsMethod === 'manual' && d.smsOwner.trim() === '') return false;
  if (d.awardType === 'cash') return true;
  const terms = resolveTerms(d);
  return resolveExpiry(d) !== null && terms?.minOdds !== undefined && terms?.maxWin !== undefined;
}

const isPreset = (v: string): v is ExpiryPreset => EXPIRY_PRESETS.some((p) => p.value === v);

export interface BulkUploadDetailsProps {
  value: DetailsState;
  onChange: (next: DetailsState) => void;
}

/** Step 1 — batch details: award type, expiry, terms and SMS. The upload IS the campaign: no promo config is selected. */
export function BulkUploadDetails({ value, onChange }: BulkUploadDetailsProps) {
  const set = <K extends keyof DetailsState>(key: K, v: DetailsState[K]) => onChange({ ...value, [key]: v });
  /* Switching award type swaps the SMS default only while the operator has not edited the message. */
  const setAwardType = (t: AwardType) => {
    const untouched = value.smsMessage === DEFAULT_SMS_MESSAGE || value.smsMessage === DEFAULT_SMS_MESSAGE_CASH;
    onChange({ ...value, awardType: t, smsMessage: untouched ? (t === 'cash' ? DEFAULT_SMS_MESSAGE_CASH : DEFAULT_SMS_MESSAGE) : value.smsMessage });
  };
  const market = MARKETS[value.market];
  const isCash = value.awardType === 'cash';
  const label = AWARD_LABEL[value.awardType];
  const absoluteDate = parseAbsoluteExpiry(value.absoluteIso);

  return (
    <div className="bulk-upload__form">
      <label className="bulk-upload__field bulk-upload__field--full">
        <span className="bulk-upload__label">
          Batch name <span className="bulk-upload__required" aria-hidden="true">*</span>
        </span>
        <input
          className="bulk-upload__input"
          data-testid="bulk-details-name"
          value={value.name}
          placeholder="e.g. Premier League winners — week 12"
          required
          onChange={(e) => set('name', e.target.value)}
        />
      </label>

      <label className="bulk-upload__field">
        <span className="bulk-upload__label">Reference</span>
        <input
          className="bulk-upload__input"
          data-testid="bulk-details-reference"
          value={value.reference}
          placeholder="Optional — campaign or ticket reference"
          onChange={(e) => set('reference', e.target.value)}
        />
        <span className="bulk-upload__hint">Free text, stored on every award record for reconciliation.</span>
      </label>

      <label className="bulk-upload__field">
        <span className="bulk-upload__label">Market</span>
        <select
          className="bulk-upload__select"
          data-testid="bulk-details-market"
          value={value.market}
          onChange={(e) => { if (isMarketCode(e.target.value)) set('market', e.target.value); }}
        >
          {MARKET_CODES.map((code) => (
            <option key={code} value={code}>{MARKETS[code].label} ({code}) · {MARKETS[code].currency}</option>
          ))}
        </select>
        <span className="bulk-upload__hint">MSISDNs are normalised to +{market.countryCode}; amounts are in {market.currency}.</span>
      </label>

      {/* Award type — segmented control (same pattern as the page mode toggle). */}
      <div className="bulk-upload__field">
        <span className="bulk-upload__label" id="bulk-details-award-type-label">Award type</span>
        <div className="bulk-upload__segmented" role="group" aria-labelledby="bulk-details-award-type-label" data-testid="bulk-details-award-type">
          {AWARD_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`bulk-upload__segment${value.awardType === t.value ? ' bulk-upload__segment--active' : ''}`}
              aria-pressed={value.awardType === t.value}
              data-testid={`bulk-award-${t.value}`}
              onClick={() => setAwardType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="bulk-upload__hint">
          {isCash ? 'Cash is credited to the main wallet with no expiry or terms.' : `${label} awards need an expiry and terms.`}
        </span>
      </div>

      {/* Expiry — relative presets or an absolute GMT date-time. Hidden for cash. */}
      {!isCash && (
        <div className="bulk-upload__field">
          <span className="bulk-upload__label" id="bulk-details-expiry-label">
            {label} expiry <span className="bulk-upload__required" aria-hidden="true">*</span>
          </span>
          <div className="bulk-upload__segmented bulk-upload__segmented--small" role="group" aria-label="Expiry mode" data-testid="bulk-details-expiry-mode">
            <button
              type="button"
              className={`bulk-upload__segment${value.expiryMode === 'relative' ? ' bulk-upload__segment--active' : ''}`}
              aria-pressed={value.expiryMode === 'relative'}
              data-testid="bulk-expiry-mode-relative"
              onClick={() => set('expiryMode', 'relative')}
            >
              After crediting
            </button>
            <button
              type="button"
              className={`bulk-upload__segment${value.expiryMode === 'absolute' ? ' bulk-upload__segment--active' : ''}`}
              aria-pressed={value.expiryMode === 'absolute'}
              data-testid="bulk-expiry-mode-absolute"
              onClick={() => set('expiryMode', 'absolute')}
            >
              Fixed date (GMT)
            </button>
          </div>
          {value.expiryMode === 'relative' ? (
            <>
              <div className="bulk-upload__expiry-row">
                <select
                  className="bulk-upload__select"
                  data-testid="bulk-details-expiry-preset"
                  aria-labelledby="bulk-details-expiry-label"
                  value={value.expiryPreset}
                  onChange={(e) => { if (isPreset(e.target.value)) set('expiryPreset', e.target.value); }}
                >
                  {EXPIRY_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                {value.expiryPreset === 'custom' && (
                  <>
                    <input
                      className="bulk-upload__input bulk-upload__input--short"
                      data-testid="bulk-details-expiry-value"
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      aria-label="Custom expiry value"
                      value={value.customValue}
                      onChange={(e) => set('customValue', e.target.value)}
                    />
                    <select
                      className="bulk-upload__select"
                      data-testid="bulk-details-expiry-unit"
                      aria-label="Custom expiry unit"
                      value={value.customUnit}
                      onChange={(e) => set('customUnit', e.target.value === 'hours' ? 'hours' : 'days')}
                    >
                      <option value="hours">hours</option>
                      <option value="days">days</option>
                    </select>
                  </>
                )}
              </div>
              <span className="bulk-upload__hint">Counted from the moment each {label} is credited.</span>
            </>
          ) : (
            <>
              {/* Native datetime-local: the shared DateTimeField is local-time with 5-minute steps, so a GMT 23:59 cut-off is not reachable with it. */}
              <input
                className="bulk-upload__input"
                data-testid="bulk-details-expiry-absolute"
                type="datetime-local"
                step={60}
                aria-labelledby="bulk-details-expiry-label"
                value={value.absoluteIso}
                onChange={(e) => set('absoluteIso', e.target.value)}
              />
              <span className="bulk-upload__hint" data-testid="bulk-details-expiry-absolute-hint">
                {absoluteDate
                  ? `${formatAbsoluteExpiry(value.absoluteIso)} · ${relativeExpiryLabel(value.absoluteIso)}`
                  : 'Enter the date and time in GMT; every award in the batch expires at this moment.'}
              </span>
            </>
          )}
        </div>
      )}

      <TermsBlock value={value} set={set} currency={market.currency} />
      <SmsBlock value={value} set={set} />

      <label className="bulk-upload__field bulk-upload__field--full">
        <span className="bulk-upload__label">Description</span>
        <textarea
          className="bulk-upload__input bulk-upload__textarea"
          data-testid="bulk-details-description"
          value={value.description}
          placeholder="Optional — what this batch is for"
          rows={3}
          onChange={(e) => set('description', e.target.value)}
        />
      </label>
    </div>
  );
}

interface BlockProps {
  value: DetailsState;
  set: <K extends keyof DetailsState>(key: K, v: DetailsState[K]) => void;
}

/** Terms — minOdds + maxWin for FreeBet and Bonus, rollover for Bonus only; nothing for Cash. */
function TermsBlock({ value, set, currency }: BlockProps & { currency: string }) {
  if (value.awardType === 'cash') return null;
  return (
    <fieldset className="bulk-upload__group bulk-upload__field--full" data-testid="bulk-details-terms">
      <legend className="bulk-upload__group-title">{AWARD_LABEL[value.awardType]} terms</legend>
      <div className="bulk-upload__group-grid">
        <label className="bulk-upload__field">
          <span className="bulk-upload__label">
            Minimum odds <span className="bulk-upload__required" aria-hidden="true">*</span>
          </span>
          <input
            className="bulk-upload__input"
            data-testid="bulk-details-min-odds"
            type="number"
            min={1}
            step={0.01}
            inputMode="decimal"
            placeholder="e.g. 1.50"
            value={value.minOdds}
            onChange={(e) => set('minOdds', e.target.value)}
          />
        </label>
        <label className="bulk-upload__field">
          <span className="bulk-upload__label">
            Maximum win ({currency}) <span className="bulk-upload__required" aria-hidden="true">*</span>
          </span>
          <input
            className="bulk-upload__input"
            data-testid="bulk-details-max-win"
            type="number"
            min={1}
            step={1}
            inputMode="decimal"
            placeholder="e.g. 5000"
            value={value.maxWin}
            onChange={(e) => set('maxWin', e.target.value)}
          />
        </label>
        {value.awardType === 'bonus' && (
          <label className="bulk-upload__field">
            <span className="bulk-upload__label">Rollover multiplier</span>
            <input
              className="bulk-upload__input"
              data-testid="bulk-details-rollover"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="e.g. 5"
              value={value.rolloverMultiplier}
              onChange={(e) => set('rolloverMultiplier', e.target.value)}
            />
            <span className="bulk-upload__hint">Times the bonus must be wagered before withdrawal.</span>
          </label>
        )}
      </div>
    </fieldset>
  );
}

/** SMS notification: message template with {amount} / {expiry}, manual (named owner) or automated (mock queue). */
function SmsBlock({ value, set }: BlockProps) {
  return (
    <fieldset className="bulk-upload__group bulk-upload__field--full" data-testid="bulk-details-sms">
      <legend className="bulk-upload__group-title">SMS notification</legend>
      <div className="bulk-upload__group-grid">
        <label className="bulk-upload__field bulk-upload__field--full">
          <span className="bulk-upload__label">Message</span>
          <textarea
            className="bulk-upload__input bulk-upload__textarea"
            data-testid="bulk-details-sms-message"
            value={value.smsMessage}
            rows={3}
            onChange={(e) => set('smsMessage', e.target.value)}
          />
          <span className="bulk-upload__hint">Placeholders {'{amount}'} and {'{expiry}'} are filled per recipient in the download list.</span>
        </label>

        <div className="bulk-upload__field" role="radiogroup" aria-labelledby="bulk-details-sms-method-label">
          <span className="bulk-upload__label" id="bulk-details-sms-method-label">Send method</span>
          <div className="bulk-upload__radios">
            <label className="bulk-upload__radio">
              <input
                type="radio"
                name="bulk-sms-method"
                value="automated"
                data-testid="bulk-sms-method-automated"
                checked={value.smsMethod === 'automated'}
                onChange={() => set('smsMethod', 'automated')}
              />
              <span>Automated <span className="bulk-upload__hint">— queued by the platform (mock)</span></span>
            </label>
            <label className="bulk-upload__radio">
              <input
                type="radio"
                name="bulk-sms-method"
                value="manual"
                data-testid="bulk-sms-method-manual"
                checked={value.smsMethod === 'manual'}
                onChange={() => set('smsMethod', 'manual')}
              />
              <span>Manual <span className="bulk-upload__hint">— a named owner sends from the recipient list</span></span>
            </label>
          </div>
        </div>

        {value.smsMethod === 'manual' && (
          <label className="bulk-upload__field">
            <span className="bulk-upload__label">
              Owner <span className="bulk-upload__required" aria-hidden="true">*</span>
            </span>
            <input
              className="bulk-upload__input"
              data-testid="bulk-details-sms-owner"
              value={value.smsOwner}
              placeholder="Who sends the SMS"
              onChange={(e) => set('smsOwner', e.target.value)}
            />
          </label>
        )}
      </div>
    </fieldset>
  );
}

export default BulkUploadDetails;
