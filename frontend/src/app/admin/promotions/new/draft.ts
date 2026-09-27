/**
 * Wizard draft model: New Promotion flow (/admin/promotions/new).
 * The in-progress working copy is a single typed PromotionDraft persisted to
 * localStorage (promo_draft_v2); explicit "Save draft" writes the same shape,
 * keyed by promotion reference, through @/lib/promotions/draftStore
 * (promo-drafts:v1). Step 1 (Basics) is template-driven: selecting a template
 * writes its full prefill (src/data/promotion-templates.ts) over a fresh base
 * draft. Zambia is the implicit market and the game provider is derived by the
 * engine, so the draft carries neither.
 */
import { SEED_TIERS, getTemplate } from '@/data/promotion-templates';
import type {
 CreditTiming,
 EndMode,
 PayoutMode,
 ProductVertical,
 PromotionTypeId,
 RewardType,
 TemplateId,
 TierRow,
} from '@/data/promotion-templates';
import { BET_RESTRICTIONS, QUALIFICATION_EVENT_IDS, isNumericType } from '@/data/event-catalog';
import type { EventId } from '@/data/event-catalog';
import { isRangeOperator, isZeroArityOperator } from '@/data/operator-catalog';
import { CHANNELS, allChannels, cloneNotifications, defaultDraftNotifications } from '@/lib/promotions';
import type { Channel, Notifications } from '@/lib/promotions';
import type { StepId } from './steps';

export interface TriggerRule {
 id: string;
 param: string;
 type: string;
 operator: string;
 value: string;
 value2?: string;
}

/** How a trigger combines with the trigger before it. Unset on the first trigger. */
export type TriggerJoin = 'and' | 'or';
export const TRIGGER_JOINS: TriggerJoin[] = ['and', 'or'];
export const TRIGGER_JOIN_LABELS: Record<TriggerJoin, string> = { and: 'AND', or: 'OR' };

export interface Trigger {
 id: string;
 eventId: EventId;
 rules: TriggerRule[];
 /** Join with the previous trigger; absent on the first trigger. Legacy drafts default to 'or'. */
 join?: TriggerJoin;
}

/** First trigger never carries a join; every later trigger has one (default 'or'). */
export function normalizeTriggerJoins(triggers: Trigger[]): Trigger[] {
 return triggers.map((trigger, index) => {
 if (index === 0) {
 const { join, ...rest } = trigger;
 void join;
 return rest;
 }
 return { ...trigger, join: trigger.join === 'and' ? 'and' : 'or' };
 });
}

/**
 * AND binds tighter than OR: `A AND B OR C` → [[A, B], [C]]. The promotion
 * qualifies when every trigger in any one group fires.
 */
export function triggerGroups(triggers: Trigger[]): Trigger[][] {
 const groups: Trigger[][] = [];
 triggers.forEach((trigger, index) => {
 if (index === 0 || trigger.join !== 'and') groups.push([trigger]);
 else groups[groups.length - 1].push(trigger);
 });
 return groups;
}

/** Human-readable chain, e.g. "Bet Settled AND Deposit OR Registration". */
export function triggerChainSummary(triggers: Trigger[], label: (trigger: Trigger) => string): string {
 return triggers
 .map((trigger, index) => (index > 0 ? `${TRIGGER_JOIN_LABELS[trigger.join ?? 'or']} ` : '') + label(trigger))
 .join(' ');
}

/**
 * Triggers (each an AND of rules, chained with AND / OR joins) plus
 * promotion-wide counting rules.
 * Audience targeting ("Who's eligible") was removed: persisted legacy values
 * are silently discarded by sanitizeQualification.
 */
export interface Qualification {
 triggers: Trigger[];
 counting: TriggerRule[];
}

/** The loader reads only v2; v1 payloads are ignored rather than migrated. */
export const DRAFT_KEY = 'promo_draft_v2';

/* ------------------------------------------------------------------ */
/* Combinable flag + stake-back reward (100% Cash Stake Back).  */
/* Additive fields: drafts saved before they existed load with the     */
/* defaults in baseDraft(); the store sanitiser applies the same ones. */
/* ------------------------------------------------------------------ */

/* Stake funding, Selections and odds are ordinary trigger rules: see the
 * Bet Placed / Bet Settled params in data/event-catalog.ts. */

/** "10000" → "10,000" (domain convention: thousands separators, up to 2 decimals). */
export function formatAwardCap(value: string): string {
  const n = Number(value);
  if (!value.trim() || !Number.isFinite(n)) return value;
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** Review reward line: "{pct}% of stake, up to {cap}" or "{pct}% of stake, no cap". */
export function stakePercentageSummary(percentage: string, maxValuePerAward: string): string {
  const pct = percentage.trim() || '·';
  const cap = maxValuePerAward.trim();
  return cap ? `${pct}% of stake, up to ${formatAwardCap(cap)}` : `${pct}% of stake, no cap`;
}

export interface BannerSlot {
 id: number;
 kind: 'fixed' | 'extra';
 label: string;
 placement: string;
 device: string;
 fileName: string;
 preview: string;
}

export interface PromotionDraft {
 template: TemplateId | null;
 step: number;
 /** True once the user has edited any field after the last template apply. */
 dirty: boolean;
 /* Persistence (Save draft / resume). Additive: absent on legacy scratch drafts. */
 /** Promotion reference (`PR-xxx`) this draft is stored under; `null` until first save. */
 reference: string | null;
 /** 1-based visible step index the author was on at the last save. */
 lastStep: number;
 /** Step id at the last save; wins over `lastStep` when the stepper renumbers. */
 lastStepId: StepId | null;
 /** ISO timestamp of the last explicit save; `null` when never saved. */
 savedAt: string | null;
 /** Saved drafts are always drafts; approval happens on the list row, never in the store. */
 status: 'draft';
 /* Basics */
 name: string;
 type: PromotionTypeId | '';
 vertical: ProductVertical | '';
 /* Qualification */

 qualification: Qualification;
  /** Surfaces a player can qualify through; at least one is required. */
  channels: Channel[];
  /** Recorded on the promotion and in T&Cs only; not enforced by the engine yet. Additive. */
  combinableWithOtherOffers: boolean;


 /* Award */
 rewardType: RewardType;
 freebetCount: string;
 freebetValue: string;
 freebetExpiryHours: string;
 payoutMode: PayoutMode;
 fixedAmount: string;
 tiers: TierRow[];
 payoutCap: string;
 maxAwardsPerDay: string;
 lifetimeCount: string;
 lifetimeValue: string;
 /* Stake-back reward (additive). */
 /** Percentage of the qualifying cash stake returned (1–100) when payoutMode is `percentage`. */
 stakePercentage: string;
 /** Cap on the value of a single award; empty = no cap. */
 maxValuePerAward: string;
 creditTiming: CreditTiming;
 creditTime: string;
 restrictedProduct: string;
 wholeStakeOnly: boolean;
 winningsExcludeStake: boolean;
 withholdOtherOffers: boolean;
 /* Budget */
 budget: string;
 alertThreshold: string;
 alertRecipients: string;
 /* Schedule */
 startDate: string;
 startTime: string;
 endMode: EndMode;
 endDate: string;
 endTime: string;
 /* Content */
 shortDescription: string;
 /* Optional player messages sent when a player qualifies or receives an award. */
 notifications: Notifications;
 bannerSlots: BannerSlot[];
 nextSlotId: number;
 tcsFileName: string;
 tcsSummary: string;
}

/**
 * Normalizes persisted data from older prototype revisions. Invalid and v1
 * qualification payloads have no usable qualification object, so start them
 * from the current empty rules model rather than attempting to infer semantics.
 */
function isEventId(value: unknown): value is EventId {
 return Object.values(QUALIFICATION_EVENT_IDS).includes(value as EventId);
}

/**
 * Restriction params from earlier prototype revisions that no longer exist in the
 * catalog. They were hidden checkbox exclusions, so drop them silently instead
 * of surfacing them as visible conditions on resumed drafts.
 */
const LEGACY_RESTRICTION_PARAMS = new Set(['Free Bet']);

function sanitizeRule(value: unknown): TriggerRule | undefined {
 if (!value || typeof value !== 'object') return undefined;

 const rule = value as Partial<TriggerRule>;

 if (
 typeof rule.id !== 'string'
 || typeof rule.param !== 'string'
 || typeof rule.type !== 'string'
 || typeof rule.operator !== 'string'
 || typeof rule.value !== 'string'
 ) {
 return undefined;
 }

 if (LEGACY_RESTRICTION_PARAMS.has(rule.param)) return undefined;

 return {
 id: rule.id,
 param: rule.param,
 type: rule.type,
 operator: rule.operator,
 value: rule.value,
 ...(typeof rule.value2 === 'string' ? { value2: rule.value2 } : {}),
 };
}

/**
 * Canonical exclusion rules (`param = No`) for every restriction. The set is
 * fixed and independent of the trigger event: every new trigger starts with all
 * of them ticked so the standard offer excludes voided, cancelled and cashed-out
 * bets unless the author unticks one. Free-bet stakes are handled by the
 * `Stake Funding` condition, not a restriction. Rule IDs are deterministic per
 * trigger so re-creation is stable.
 */
export function defaultRestrictionRules(triggerId: string): TriggerRule[] {
  return BET_RESTRICTIONS.map((restriction) => ({
    id: `${triggerId}-restrict-${restriction.param.toLowerCase().replace(/\s+/g, '-')}`,
    param: restriction.param,
    type: 'boolean',
    operator: '=',
    value: 'No',
  }));
}

export function emptyQualification(): Qualification {
 return {
 triggers: [{
      id: 'primary-trigger',
      eventId: QUALIFICATION_EVENT_IDS.betSettled,
      rules: defaultRestrictionRules('primary-trigger'),
    }],
 counting: [],
 };
}

export function cloneQualification(qualification: Qualification): Qualification {
 return {
 triggers: normalizeTriggerJoins(qualification.triggers.map((trigger) => ({
 ...trigger,
 rules: trigger.rules.map((rule) => ({ ...rule })),
 }))),
 counting: qualification.counting.map((rule) => ({ ...rule })),
 };
}

export function sanitizeQualification(value: unknown): Qualification {
 if (!value || typeof value !== 'object') return emptyQualification();

 const candidate = value as Partial<Qualification>;

 if (!Array.isArray(candidate.triggers) || !Array.isArray(candidate.counting)) {
 return emptyQualification();
 }

 const triggers: Trigger[] = candidate.triggers.flatMap((value) => {
 if (!value || typeof value !== 'object') return [];

 const trigger = value as Partial<Trigger>;

 if (
 typeof trigger.id !== 'string'
 || !isEventId(trigger.eventId)
 || !Array.isArray(trigger.rules)
 ) {
 return [];
 }

 return [{
 id: trigger.id,
 eventId: trigger.eventId,
 rules: trigger.rules.flatMap((rule) => {
 const sanitized = sanitizeRule(rule);
 return sanitized ? [sanitized] : [];
 }),
 ...(trigger.join === 'and' || trigger.join === 'or' ? { join: trigger.join } : {}),
 }];
 });

 if (triggers.length === 0) return emptyQualification();

 const counting = candidate.counting.flatMap((rule) => {
 const sanitized = sanitizeRule(rule);
 return sanitized ? [sanitized] : [];
 });

 /* Legacy drafts may carry an `eligibility` key; it is dropped, not migrated.
 * Pre-join drafts have no `join` on later triggers: they were OR branches. */
 return { triggers: normalizeTriggerJoins(triggers), counting };
}

/**
 * Draft restore: an absent `channels` key (drafts saved before the field
 * existed) means all four; unknown values are dropped but an explicit empty
 * selection is preserved so Step 2 validation can surface it.
 */
export function sanitizeDraftChannels(value: unknown): Channel[] {
  if (value === undefined) return allChannels();
  if (!Array.isArray(value)) return allChannels();
  return CHANNELS.filter((channel) => value.includes(channel));
}

export function baseSlots(): BannerSlot[] {
 return [
 { id: 1, kind: 'fixed', label: 'Promotions page · desktop', placement: 'Promotions page', device: 'Desktop', fileName: '', preview: '' },
 { id: 2, kind: 'fixed', label: 'Promotions page · mobile', placement: 'Promotions page', device: 'Mobile', fileName: '', preview: '' },
 ];
}

export function baseDraft(): PromotionDraft {
 return {
 template: null,
 step: 1,
 dirty: false,
 reference: null,
 lastStep: 1,
 lastStepId: null,
 savedAt: null,
 status: 'draft',
 name: '',
 type: '',

 vertical: '',
channels: allChannels(),
 qualification: emptyQualification(),
 combinableWithOtherOffers: false,

 rewardType: 'freebet',
 freebetCount: '',
 freebetValue: '',
 freebetExpiryHours: '24',
 payoutMode: 'fixed',
 fixedAmount: '',
 tiers: SEED_TIERS.map((t) => ({ ...t })),
 payoutCap: '',
 maxAwardsPerDay: '',
 lifetimeCount: '',
 lifetimeValue: '',
 stakePercentage: '',
 maxValuePerAward: '',
 creditTiming: 'instant',
 creditTime: '14:00',
 restrictedProduct: '',
 wholeStakeOnly: false,
 winningsExcludeStake: false,
 withholdOtherOffers: false,
 budget: '',
 alertThreshold: '90',
 alertRecipients: '',
 startDate: '',
 startTime: '',
 endMode: 'ongoing',
 endDate: '',
 endTime: '',
 shortDescription: '',
 notifications: defaultDraftNotifications(),
 bannerSlots: baseSlots(),
 nextSlotId: 3,
 tcsFileName: '',
 tcsSummary: '',
 };
}

/** Full template prefill: a fresh base draft overlaid with the template prefill. */
export function templateDraft(id: TemplateId): PromotionDraft {
 const prefill = getTemplate(id).prefill;

 return {
 ...baseDraft(),
 ...prefill,
 qualification: prefill.qualification
 ? cloneQualification(prefill.qualification)
 : emptyQualification(),
 tiers: (prefill.tiers ?? SEED_TIERS).map((t) => ({ ...t })),
    channels: prefill.channels ? [...prefill.channels] : allChannels(),
 notifications: prefill.notifications ? cloneNotifications(prefill.notifications) : defaultDraftNotifications(),
 template: id,
 step: 1,
 dirty: false,
 };
}

/* Step 1 (Basics) required-field validation → inline errors keyed by field. */
export function validateBasics(d: PromotionDraft): Record<string, string> {
 const e: Record<string, string> = {};

 if (!d.name.trim()) e.name = 'Name is required.';
 if (!d.type) e.type = 'Select a promotion type.';
 if (!d.vertical) e.vertical = 'Select a product vertical.';

 return e;
}

/** Step 2 validation reads only the current qualification shape. */
/** Both enabled message triggers need a delivery channel and complete copy. */
export function validateNotifications(d: PromotionDraft): Record<string, string> {
 const errors: Record<string, string> = {};
 for (const trigger of ['onQualify', 'onAward'] as const) {
 const rule = d.notifications[trigger];
 if (!rule.enabled) continue;
 if (rule.channels.length === 0) errors[`notification:${trigger}:channels`] = 'Select at least one delivery channel.';
 if (!rule.title.trim()) errors[`notification:${trigger}:title`] = 'Title is required when this notification is enabled.';
 if (!rule.body.trim()) errors[`notification:${trigger}:body`] = 'Message is required when this notification is enabled.';
 }
 return errors;
}

export function validateQualification(d: PromotionDraft): Record<string, string> {
 const errors: Record<string, string> = {};

 if (d.qualification.triggers.length === 0) {
 errors.triggers = 'Add at least one trigger.';
}

  if (d.channels.length === 0) {
    errors.channels = 'Select at least one channel.';
 }

 for (const trigger of d.qualification.triggers) {
 if (!isEventId(trigger.eventId)) {
 errors[`trigger:${trigger.id}`] = 'Select a valid event.';
 }

 for (const rule of trigger.rules) {
 if (isZeroArityOperator(rule.operator)) continue;

 const key = `rule:${rule.id}`;

 if (isRangeOperator(rule.operator)) {
 if (!rule.value.trim() || !rule.value2?.trim()) {
 errors[key] = 'Enter both Min and Max values.';
 } else if (
 isNumericType(rule.type)
 && Number(rule.value) >= Number(rule.value2)
 ) {
 errors[key] = 'Min must be less than Max.';
 }
 } else if (!rule.value.trim()) {
 errors[key] = 'Enter a value.';
 }
 }
 }

 for (const rule of d.qualification.counting) {
 if (isZeroArityOperator(rule.operator)) continue;

 const key = `counting:${rule.id}`;

 if (isRangeOperator(rule.operator)) {
 if (!rule.value.trim() || !rule.value2?.trim()) {
 errors[key] = 'Enter both Min and Max values.';
 } else if (
 isNumericType(rule.type)
 && Number(rule.value) >= Number(rule.value2)
 ) {
 errors[key] = 'Min must be less than Max.';
 }
 } else if (!rule.value.trim()) {
 errors[key] = 'Enter a value.';
 }
 }

 return errors;
}

/** Award-step checks for the stake-back reward (percentage 1–100; cap must be positive when set). */
export function validateStakeBack(d: PromotionDraft): Record<string, string> {
 const errors: Record<string, string> = {};
 if (d.rewardType === 'cash' && d.payoutMode === 'percentage') {
 const pct = Number(d.stakePercentage);
 if (!d.stakePercentage.trim() || !Number.isFinite(pct) || pct < 1 || pct > 100) {
 errors.stakePercentage = 'Enter a percentage between 1 and 100.';
 }
 }
 if (d.maxValuePerAward.trim()) {
 const cap = Number(d.maxValuePerAward);
 if (!Number.isFinite(cap) || cap <= 0) errors.maxValuePerAward = 'Enter an amount greater than 0, or leave blank for no cap.';
 }
 return errors;
}