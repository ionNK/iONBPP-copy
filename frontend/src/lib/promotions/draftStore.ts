/**
 * Promotion draft store (PROTOTYPE, localStorage).
 *
 * Explicit "Save draft" / "Save and exit" in the New Promotion wizard write a
 * full PromotionDraft here under `promo-drafts:v1`, keyed by promotion
 * reference (`PR-xxx`). The wizard's autosaving scratch copy
 * (`promo_draft_v2`, see app/admin/promotions/new/draft.ts) is unchanged and
 * remains the "resume where you were" slot for the current session; this
 * store is the durable, per-promotion record the list resumes from.
 *
 * Same pattern as hooks/usePromotionHealthSelection: everything read from
 * storage goes through a sanitiser that drops unknown keys, coerces each
 * field to its type (falling back to the base draft) and clamps `lastStep`
 * to a valid visible step index. Corrupt payloads are ignored, never thrown.
 *
 * Seeded Draft promotions (PROMO_SEED rows with status 'draft', e.g. PR-004)
 * have no stored draft until the author first saves: `loadDraft` returns a
 * base draft synthesised from the list row (name, type, vertical, channels,
 * notifications) so the wizard opens them editable. The first save writes a
 * real entry under the same reference and the wizard updates the existing
 * list row in place, so a seeded draft is never duplicated and PROMO_SEED is
 * never modified.
 */

import { baseDraft, baseSlots, sanitizeDraftChannels, sanitizeQualification } from '@/app/admin/promotions/new/draft';
import type { BannerSlot, PromotionDraft } from '@/app/admin/promotions/new/draft';
import { STEPS, clampStep, isStepId, resolveStepIndex, stepIdAt } from '@/app/admin/promotions/new/steps';
import { PROMOTION_TYPES, PRODUCT_VERTICALS, SEED_TIERS } from '@/data/promotion-templates';
import type { CreditTiming, EndMode, PayoutMode, PromotionTypeId, ProductVertical, RewardType, TierRow } from '@/data/promotion-templates';
import { loadPromotions, normalizeNotifications } from '@/lib/promotions';
import type { Promo } from '@/lib/promotions';

export const DRAFTS_KEY = 'promo-drafts:v1';

/** Total visible steps, for "Resumed from step N of M". */
export const DRAFT_STEP_COUNT = STEPS.length;

/** Map of promotion reference → saved draft, as persisted. */
export type DraftStore = Record<string, PromotionDraft>;

/* ------------------------------------------------------------------ */
/* Sanitiser                                                            */
/* ------------------------------------------------------------------ */

const REWARD_TYPES: RewardType[] = ['freebet', 'cash'];
const PAYOUT_MODES: PayoutMode[] = ['fixed', 'tiers', 'percentage'];
const CREDIT_TIMINGS: CreditTiming[] = ['instant', 'next-day', 'manual'];
const END_MODES: EndMode[] = ['date', 'ongoing'];
const TYPE_IDS = PROMOTION_TYPES.map((t) => t.id);

const str = (value: unknown, fallback: string): string => (typeof value === 'string' ? value : fallback);
const bool = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);
const oneOf = <V extends string>(value: unknown, options: readonly V[], fallback: V): V =>
  typeof value === 'string' && (options as readonly string[]).includes(value) ? (value as V) : fallback;

/** ISO string that parses to a real date; anything else is "never saved". */
const isoOrNull = (value: unknown): string | null =>
  typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;

function sanitizeTiers(value: unknown): TierRow[] {
  if (!Array.isArray(value)) return SEED_TIERS.map((t) => ({ ...t }));
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const tier = row as Partial<TierRow>;
    if (typeof tier.odds !== 'string' || typeof tier.multiplier !== 'string') return [];
    return [{ odds: tier.odds, multiplier: tier.multiplier }];
  });
}

/* Content banners are hidden behind features.content but round-trip untouched. */
function sanitizeSlots(value: unknown): BannerSlot[] {
  if (!Array.isArray(value)) return baseSlots();
  const slots = value.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const slot = raw as Partial<BannerSlot>;
    if (typeof slot.id !== 'number' || (slot.kind !== 'fixed' && slot.kind !== 'extra')) return [];
    return [{
      id: slot.id,
      kind: slot.kind,
      label: str(slot.label, ''),
      placement: str(slot.placement, ''),
      device: str(slot.device, ''),
      fileName: str(slot.fileName, ''),
      preview: str(slot.preview, ''),
    }];
  });
  return slots.length > 0 ? slots : baseSlots();
}

/**
 * Coerces whatever is in storage into a valid PromotionDraft. Unknown keys are
 * discarded (the result is built field-by-field from the base draft), every
 * enum falls back to its default and `lastStep` is clamped into the current
 * visible step range — via `lastStepId` first so a draft saved while Content
 * was visible still lands on the right step after renumbering.
 */
export function sanitizeDraft(raw: unknown, reference: string | null): PromotionDraft {
  const rec = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const base = baseDraft();
  const tpl = rec.template;
  const lastStepId = isStepId(rec.lastStepId) ? rec.lastStepId : null;
  const lastStep = resolveStepIndex(lastStepId, rec.lastStep);
  const restrictedProduct = rec.restrictedProduct;

  return {
    template: tpl === 'welcome_offer' || tpl === 'cashback' ? tpl : null,
    step: lastStep,
    dirty: false,
    reference: typeof rec.reference === 'string' && rec.reference ? rec.reference : reference,
    lastStep,
    lastStepId,
    savedAt: isoOrNull(rec.savedAt),
    status: 'draft',
    /* Basics */
    name: str(rec.name, base.name),
    type: oneOf<PromotionTypeId | ''>(rec.type, [...TYPE_IDS, ''], ''),
    vertical: oneOf<ProductVertical | ''>(rec.vertical, [...PRODUCT_VERTICALS, ''], ''),
    /* Qualification */
    qualification: sanitizeQualification(rec.qualification),
    channels: sanitizeDraftChannels(rec.channels),
    /* Combinable flag (additive: absent on older drafts → default) */
    combinableWithOtherOffers: bool(rec.combinableWithOtherOffers, base.combinableWithOtherOffers),
    /* Award */
    rewardType: oneOf(rec.rewardType, REWARD_TYPES, base.rewardType),
    freebetCount: str(rec.freebetCount, base.freebetCount),
    freebetValue: str(rec.freebetValue, base.freebetValue),
    freebetExpiryHours: str(rec.freebetExpiryHours, base.freebetExpiryHours),
    payoutMode: oneOf(rec.payoutMode, PAYOUT_MODES, base.payoutMode),
    fixedAmount: str(rec.fixedAmount, base.fixedAmount),
    tiers: sanitizeTiers(rec.tiers),
    payoutCap: str(rec.payoutCap, base.payoutCap),
    maxAwardsPerDay: str(rec.maxAwardsPerDay, base.maxAwardsPerDay),
    lifetimeCount: str(rec.lifetimeCount, base.lifetimeCount),
    lifetimeValue: str(rec.lifetimeValue, base.lifetimeValue),
    /* Stake-back reward (additive) */
    stakePercentage: str(rec.stakePercentage, base.stakePercentage),
    maxValuePerAward: str(rec.maxValuePerAward, base.maxValuePerAward),
    creditTiming: oneOf(rec.creditTiming, CREDIT_TIMINGS, base.creditTiming),
    creditTime: str(rec.creditTime, base.creditTime),
    restrictedProduct: typeof restrictedProduct === 'string'
      && (restrictedProduct === '' || (PRODUCT_VERTICALS as string[]).includes(restrictedProduct))
      ? restrictedProduct
      : base.restrictedProduct,
    wholeStakeOnly: bool(rec.wholeStakeOnly, base.wholeStakeOnly),
    winningsExcludeStake: bool(rec.winningsExcludeStake, base.winningsExcludeStake),
    withholdOtherOffers: bool(rec.withholdOtherOffers, base.withholdOtherOffers),
    /* Budget (hidden behind features.budgets; still persisted) */
    budget: str(rec.budget, base.budget),
    alertThreshold: str(rec.alertThreshold, base.alertThreshold),
    alertRecipients: str(rec.alertRecipients, base.alertRecipients),
    /* Schedule */
    startDate: str(rec.startDate, base.startDate),
    startTime: str(rec.startTime, base.startTime),
    endMode: oneOf(rec.endMode, END_MODES, base.endMode),
    endDate: str(rec.endDate, base.endDate),
    endTime: str(rec.endTime, base.endTime),
    /* Content (hidden behind features.content; still persisted) */
    shortDescription: str(rec.shortDescription, base.shortDescription),
    notifications: normalizeNotifications(rec.notifications),
    bannerSlots: sanitizeSlots(rec.bannerSlots),
    nextSlotId: typeof rec.nextSlotId === 'number' && Number.isFinite(rec.nextSlotId) ? rec.nextSlotId : base.nextSlotId,
    tcsFileName: str(rec.tcsFileName, base.tcsFileName),
    tcsSummary: str(rec.tcsSummary, base.tcsSummary),
  };
}

/* ------------------------------------------------------------------ */
/* Storage                                                              */
/* ------------------------------------------------------------------ */

function readStore(): DraftStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const store: DraftStore = {};
    for (const [reference, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!reference) continue;
      store[reference] = sanitizeDraft(value, reference);
    }
    return store;
  } catch {
    return {};
  }
}

function writeStore(store: DraftStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(store));
  } catch {
    /* Prototype mock: storage quota failures are non-fatal. */
  }
}

/** Every saved draft, sanitised, keyed by reference. */
export function loadDrafts(): DraftStore {
  return readStore();
}

/** True when an explicit save exists for this reference. */
export function hasStoredDraft(reference: string): boolean {
  return reference in readStore();
}

/**
 * A promotion-list row's editable starting point when it has no stored draft
 * yet (seeded Drafts such as PR-004): name, type (when its label maps to a
 * wizard type), vertical, channels and notifications come across; everything
 * else is the wizard default. Never mutates the row or PROMO_SEED.
 */
export function draftFromPromo(promo: Promo): PromotionDraft {
  const type = PROMOTION_TYPES.find((t) => t.label === promo.type)?.id ?? '';
  const vertical = (PRODUCT_VERTICALS as string[]).includes(promo.vertical ?? '') ? (promo.vertical as ProductVertical) : '';
  return {
    ...baseDraft(),
    reference: promo.id,
    name: promo.name,
    type,
    vertical,
    channels: [...promo.channels],
    notifications: normalizeNotifications(promo.notifications),
    budget: promo.budget != null ? String(promo.budget) : '',
  };
}

/**
 * Draft for a reference: the stored entry when one exists, otherwise a draft
 * synthesised from the matching Draft-status list row, otherwise `null`
 * (unknown reference or a non-draft promotion).
 */
export function loadDraft(reference: string): PromotionDraft | null {
  const stored = readStore()[reference];
  if (stored) return stored;
  const promo = loadPromotions().find((p) => p.id === reference);
  if (!promo || promo.status !== 'draft') return null;
  return draftFromPromo(promo);
}

/**
 * Persists a draft under its reference, stamping `savedAt`, `lastStep` and
 * `lastStepId` from the current step. Returns the stored (sanitised) copy so
 * the caller can adopt it as the new clean baseline.
 */
export function saveDraft(draft: PromotionDraft, reference: string, now: Date = new Date()): PromotionDraft {
  const step = clampStep(draft.step);
  const next = sanitizeDraft({
    ...draft,
    reference,
    lastStep: step,
    /* Derived from the visible index, never trusted from the raw draft, so the
     * id always matches what the author was actually looking at. */
    lastStepId: stepIdAt(step),
    savedAt: now.toISOString(),
    status: 'draft',
  }, reference);
  const store = readStore();
  store[reference] = next;
  writeStore(store);
  return next;
}

/** Removes the stored draft for a reference (no-op when absent). */
export function deleteDraft(reference: string): void {
  const store = readStore();
  if (!(reference in store)) return;
  delete store[reference];
  writeStore(store);
}

/* ------------------------------------------------------------------ */
/* Saved-time copy                                                      */
/* ------------------------------------------------------------------ */

/**
 * "just now" under a minute, "N min ago" under an hour, then "N h ago", then
 * "N d ago". Shared by the wizard indicator ("Saved …") and the list row
 * ("Last saved …").
 */
export function formatSavedAgo(savedAt: string, now: Date = new Date()): string {
  const then = Date.parse(savedAt);
  if (!Number.isFinite(then)) return 'just now';
  const seconds = Math.max(0, Math.floor((now.getTime() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}
