/**
 * Wizard draft model — New Promotion flow (/admin/promotions/new).
 * A single typed PromotionDraft is persisted to localStorage (promo_draft_v2).
 * Step 1 (Basics) is template-driven: selecting a template writes its full
 * prefill (src/data/promotion-templates.ts) over a fresh base draft.
 * Zambia is the implicit market and the game provider is derived by the
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
import { QUALIFICATION_EVENT_IDS, isNumericType } from '@/data/event-catalog';
import type { EventId } from '@/data/event-catalog';
import { isRangeOperator, isZeroArityOperator } from '@/data/operator-catalog';

export interface TriggerRule {
 id: string;
 param: string;
 type: string;
 operator: string;
 value: string;
 value2?: string;
}

export interface Trigger {
 id: string;
 eventId: EventId;
 rules: TriggerRule[];
}

export interface Qualification {
 triggers: Trigger[];
 counting: TriggerRule[];
 eligibility: {
 audience: 'all' | 'new_customers';
 windowDays?: number;
 nonConsecutive?: boolean;
 };
}

/** The loader reads only v2; v1 payloads are ignored rather than migrated. */
export const DRAFT_KEY = 'promo_draft_v2';

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
 /* Basics */
 name: string;
 type: PromotionTypeId | '';
 vertical: ProductVertical | '';
 /* Qualification */

 qualification: Qualification;

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

 return {
 id: rule.id,
 param: rule.param,
 type: rule.type,
 operator: rule.operator,
 value: rule.value,
 ...(typeof rule.value2 === 'string' ? { value2: rule.value2 } : {}),
 };
}

export function emptyQualification(): Qualification {
 return {
 triggers: [{ id: 'primary-trigger', eventId: QUALIFICATION_EVENT_IDS.betSettled, rules: [] }],
 counting: [],
 eligibility: { audience: 'all' },
 };
}

export function cloneQualification(qualification: Qualification): Qualification {
 return {
 triggers: qualification.triggers.map((trigger) => ({
 ...trigger,
 rules: trigger.rules.map((rule) => ({ ...rule })),
 })),
 counting: qualification.counting.map((rule) => ({ ...rule })),
 eligibility: { ...qualification.eligibility },
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
 }];
 });

 if (triggers.length === 0) return emptyQualification();

 const counting = candidate.counting.flatMap((rule) => {
 const sanitized = sanitizeRule(rule);
 return sanitized ? [sanitized] : [];
 });

 const rawEligibility = candidate.eligibility;

 if (!rawEligibility || typeof rawEligibility !== 'object') {
 return {
 triggers,
 counting,
 eligibility: { audience: 'all' },
 };
 }

 const eligibility = rawEligibility as Qualification['eligibility'];

 if (eligibility.audience !== 'new_customers') {
 return {
 triggers,
 counting,
 eligibility: { audience: 'all' },
 };
 }

 return {
 triggers,
 counting,
 eligibility: {
 audience: 'new_customers',
 ...(typeof eligibility.windowDays === 'number'
 && Number.isFinite(eligibility.windowDays)
 ? { windowDays: eligibility.windowDays }
 : {}),
 ...(typeof eligibility.nonConsecutive === 'boolean'
 ? { nonConsecutive: eligibility.nonConsecutive }
 : {}),
 },
 };
}

export function baseSlots(): BannerSlot[] {
 return [
 { id: 1, kind: 'fixed', label: 'Promotions page — desktop', placement: 'Promotions page', device: 'Desktop', fileName: '', preview: '' },
 { id: 2, kind: 'fixed', label: 'Promotions page — mobile', placement: 'Promotions page', device: 'Mobile', fileName: '', preview: '' },
 ];
}

export function baseDraft(): PromotionDraft {
 return {
 template: null,
 step: 1,
 dirty: false,
 name: '',
 type: '',
 vertical: '',
 qualification: emptyQualification(),

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
export function validateQualification(d: PromotionDraft): Record<string, string> {
 const errors: Record<string, string> = {};

 if (d.qualification.triggers.length === 0) {
 errors.triggers = 'Add at least one trigger.';
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

 if (
 d.qualification.eligibility.audience === 'new_customers'
 && (
 !d.qualification.eligibility.windowDays
 || d.qualification.eligibility.windowDays <= 0
 )
 ) {
 errors.eligibilityDays = 'Enter the number of days.';
 }

 return errors;
}