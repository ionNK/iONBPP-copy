'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
Check, ChevronLeft, CircleCheck, FileText, ImagePlus, Info, Plus, Trash2, TriangleAlert, Upload, X,
} from 'lucide-react';
import '../promotions.css';
import './new.css';
import T from '@/theme/tokens';
import { Badge, GhostButton, PrimaryButton, Toggle } from '@/components/ui';
import { addPromotion, nextPromoId, setListNotice } from '@/lib/promotions';
import type { Promo } from '@/lib/promotions';
import { BET_RESTRICTIONS, catalogEventLabel } from '@/data/event-catalog';
import { isRangeOperator, isZeroArityOperator, QUALIFICATION_OPERATOR_VALUES } from '@/data/operator-catalog';
import { getPromotionType } from '@/data/promotion-templates';
import type { TemplateId, TierRow } from '@/data/promotion-templates';
import { DRAFT_KEY, baseDraft, sanitizeQualification, templateDraft, validateBasics, validateQualification } from './draft';
import type { BannerSlot, PromotionDraft, TriggerRule } from './draft';
import { Field, inputStyle } from './fields';
import { Step1Basics } from './Step1Basics';
import { Step2Qualification } from './Step2Qualification';

/* Draft model lives in ./draft — a single PromotionDraft persisted to
 * localStorage (DRAFT_KEY), prefilled from the template catalog. */

const STEPS = ['Basics', 'Qualification', 'Award', 'Budget', 'Schedule', 'Content', 'Review'];
const VERTICALS = ['Sportsbook', 'Aviator', 'Casino', 'Crash', 'Virtuals'];
const EXTRA_PLACEMENTS = ['Homepage', 'Casino', 'Crash'];
const DEVICES = ['Desktop', 'Mobile'];

/* Template prefills and seed data come from src/data/promotion-templates.ts
 * (see draft.ts — templateDraft overlays a full prefill on a fresh base draft). */

/** Review readback follows operator arity, without leaking stale range bounds. */
function qualificationRuleSummary(rule: TriggerRule): string {
  const label = `${rule.param} ${rule.operator}`;
  if (isZeroArityOperator(rule.operator)) return label;
  if (isRangeOperator(rule.operator)) return `${label} ${rule.value || '—'} – ${rule.value2 || '—'}`;
  return `${label} ${rule.value || '—'}`;
}

/** Read each OR branch independently; another trigger cannot cover its exclusions. */
function qualificationRestrictionRows(rules: TriggerRule[], index: number): [string, string][] {
  const active = BET_RESTRICTIONS.filter((restriction) => rules.some((rule) =>
    rule.param === restriction.param && rule.operator === QUALIFICATION_OPERATOR_VALUES.equals && rule.value === 'No',
  ));
  const rows: [string, string][] = active.length > 0
    ? [[`Trigger ${index + 1} restrictions`, `Excluded: ${active.map((restriction) => restriction.summary).join(', ')}`]]
    : [];
  for (const restriction of BET_RESTRICTIONS) {
    if (!active.includes(restriction)) {
      rows.push([`Trigger ${index + 1} — ${restriction.param} warning`, `⚠ ${restriction.warning}`]);
    }
  }
  return rows;
}

/* Per-step required-field validation → inline errors keyed by field. */
function validateStep(d: PromotionDraft, step: number): Record<string, string> {
const e: Record<string, string> = {};
if (step === 1) return validateBasics(d);
if (step === 2) return validateQualification(d);
if (step === 3) {
if (d.rewardType === 'freebet') {
if (!d.freebetCount || Number(d.freebetCount) <= 0) e.freebetCount = 'Freebet count is required.';
if (!d.freebetValue || Number(d.freebetValue) <= 0) e.freebetValue = 'Freebet value is required.';
} else if (d.payoutMode === 'fixed' && (!d.fixedAmount || Number(d.fixedAmount) <= 0)) {
e.fixedAmount = 'Fixed amount is required.';
}
}
if (step === 5) {
if (!d.startDate) e.startDate = 'Start date is required.';
if (!d.startTime) e.startTime = 'Start time is required.';
if (d.endMode === 'date') {
if (!d.endDate) e.endDate = 'End date is required.';
if (!d.endTime) e.endTime = 'End time is required.';
}
}
if (step === 6) {
if (!d.shortDescription.trim()) e.shortDescription = 'Short description is required.';
}
return e;
}

/* Map a draft to a promotions-list row. */
function typeLabel(d: PromotionDraft): string {
return getPromotionType(d.type)?.label ?? 'Custom';
}

function scheduleLabel(d: PromotionDraft): string {
if (!d.startDate) return 'Draft';
return d.endMode === 'date' && d.endDate ? `${d.startDate} – ${d.endDate}` : `${d.startDate} – ongoing`;
}

function buildPromo(d: PromotionDraft, status: 'draft' | 'pending'): Promo {
return {
id: nextPromoId(),
name: d.name.trim() || 'Untitled promotion',
type: typeLabel(d),
/* Zambia is implicit in this prototype (no Market field in the wizard). */
market: 'Zambia',
schedule: scheduleLabel(d),
budget: d.budget ? Number(d.budget) : null,
spend: null,
status,
};
}

/* ------------------------------------------------------------------ */
/* Small page-level form helpers (composition only — primitives come   */
/* from @/components/ui). Colors come from T; layout from new.css.     */
/* ------------------------------------------------------------------ */

/* Field + inputStyle moved to ./fields (shared with Step1Basics). */

const moneyInput = (
value: string,
onChange: (v: string) => void,
opts: { error?: string; placeholder?: string; ariaLabel: string },
) => (
<div className="np-input-wrap">
<input
type="number"
min="0"
step="0.01"
className="np-input"
style={inputStyle(opts.error)}
value={value}
placeholder={opts.placeholder}
aria-label={opts.ariaLabel}
onChange={(e) => onChange(e.target.value)}
/>
<span className="np-input-suffix" style={{ color: T.textSecondary }}>ZMW</span>
</div>
);


export default function NewPromotionPage() {
const router = useRouter();
const [draft, setDraft] = useState<PromotionDraft>(() => baseDraft());
const [errors, setErrors] = useState<Record<string, string>>({});
const [confirmSubmit, setConfirmSubmit] = useState(false);
const [confirmDiscard, setConfirmDiscard] = useState(false);
const restored = useRef(false);

/* Restore a persisted draft on load. */
useEffect(() => {
restored.current = true;
try {
const raw = window.localStorage.getItem(DRAFT_KEY);
if (raw) {
/* Legacy drafts (preset-based flow) carried removed keys — strip them. */
const parsed = JSON.parse(raw) as Partial<PromotionDraft> & {
preset?: unknown;
id?: unknown;
market?: unknown;
provider?: unknown;
};
const { preset, id, market, provider, ...rest } = parsed;
void preset; void id; void market; void provider;
/* Legacy drafts may carry the removed 'custom' template — sanitize. */
const tpl = rest.template;
/* eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only hydration from localStorage */
setDraft({
...baseDraft(),
...rest,
template: tpl === 'welcome_offer' || tpl === 'cashback' ? tpl : null,
/* Pre-rules-model drafts (flat fields / no primary trigger) fall back to an empty qualification. */
qualification: sanitizeQualification(rest.qualification),
});
}
} catch {
/* Corrupt draft — start clean. */
}
}, []);

/* Persist on every change (skipped until the restore effect has run). */
useEffect(() => {
if (!restored.current) return;
try {
window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
} catch {
/* Quota errors are non-fatal for the prototype. */
}
}, [draft]);

const update = (patch: Partial<PromotionDraft>) => setDraft((d) => ({ ...d, ...patch }));

const setField = <K extends keyof PromotionDraft>(key: K, value: PromotionDraft[K]) => {
update({ [key]: value, dirty: true } as Partial<PromotionDraft>);
setErrors((prev) => {
const next = { ...prev };
delete next[key as string];
/* Qualification edits invalidate trigger, counting and eligibility errors. */
if (key === 'qualification') {
for (const errorKey of Object.keys(next)) {
if (
            errorKey === 'triggers' || errorKey.startsWith('trigger:')
            || errorKey.startsWith('rule:') || errorKey.startsWith('counting:')
            || errorKey === 'eligibilityDays'
          ) delete next[errorKey];
}
}
return Object.keys(next).length === Object.keys(prev).length ? prev : next;
});
};

const clearDraft = () => {
try {
window.localStorage.removeItem(DRAFT_KEY);
} catch {
/* non-fatal */
}
};

/* Template apply — full prefill over a fresh base draft. Step 1 owns the
 * dirty-guard and confirm panel, calling this only when committed. */
const applyTemplate = (id: TemplateId) => {
setErrors({});
setDraft(templateDraft(id));
};

/* Template detach — unlocks Promotion type but keeps every field value. */
const detachTemplate = () => update({ template: null });

const goToStep = (step: number) => {
setErrors({});
update({ step });
};

const goContinue = () => {
const errs = validateStep(draft, draft.step);
if (Object.keys(errs).length > 0) {
setErrors(errs);
return;
}
goToStep(Math.min(draft.step + 1, STEPS.length));
};

const pickBanner = (slotId: number, file: File | null) => {
if (!file) return;
const reader = new FileReader();
reader.onload = () => {
setDraft((d) => ({
...d,
bannerSlots: d.bannerSlots.map((s) =>
s.id === slotId ? { ...s, fileName: file.name, preview: String(reader.result) } : s,
),
}));
};
reader.readAsDataURL(file);
};

const pickTcs = (file: File | null) => {
if (file) setField('tcsFileName', file.name);
};

const addSlot = () =>
setDraft((d) => ({
...d,
bannerSlots: [
...d.bannerSlots,
{ id: d.nextSlotId, kind: 'extra', label: 'Additional placement', placement: EXTRA_PLACEMENTS[0], device: DEVICES[0], fileName: '', preview: '' },
],
nextSlotId: d.nextSlotId + 1,
}));

const removeSlot = (slotId: number) =>
setDraft((d) => ({ ...d, bannerSlots: d.bannerSlots.filter((s) => s.id !== slotId) }));

const updateSlot = (slotId: number, patch: Partial<BannerSlot>) =>
setDraft((d) => ({ ...d, bannerSlots: d.bannerSlots.map((s) => (s.id === slotId ? { ...s, ...patch } : s)) }));

const addTier = () => setDraft((d) => ({ ...d, tiers: [...d.tiers, { odds: '', multiplier: '' }] }));
const removeTier = (i: number) => setDraft((d) => ({ ...d, tiers: d.tiers.filter((_, idx) => idx !== i) }));
const updateTier = (i: number, patch: Partial<TierRow>) =>
setDraft((d) => ({ ...d, tiers: d.tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }));

/* Save draft → adds a Draft row to the list and routes back. */
const saveDraft = () => {
addPromotion(buildPromo(draft, 'draft'));
clearDraft();
setListNotice(`${draft.name.trim() || 'Promotion'} saved as draft.`);
router.push('/admin/promotions');
};

/* Submit → confirm-before-commit → Pending approval row + toast. */
const doSubmit = () => {
addPromotion(buildPromo(draft, 'pending'));
clearDraft();
setConfirmSubmit(false);
setListNotice('Promotion submitted for approval');
router.push('/admin/promotions');
};

const doDiscard = () => {
clearDraft();
setConfirmDiscard(false);
router.push('/admin/promotions');
};

const bannersFilled = draft.bannerSlots.filter((s) => s.fileName).length;
const contentIncomplete = bannersFilled < draft.bannerSlots.length || !draft.tcsFileName;
const qualificationRules = draft.qualification.triggers.flatMap((trigger) => trigger.rules);
  const hasChannelRule = qualificationRules.some((rule) => rule.param === 'Channel');

const showTcsWarning = draft.template === 'cashback' || draft.qualification.triggers.length > 1;

return (
<div className="promo-page" style={{ background: T.offWhite }}>
{/* Top bar — Internal Tool Shell: title + subtitle, discard action right */}
<div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
<div>
<h1 className="promo-title" style={{ color: T.textPrimary }}>Create a promotion</h1>
<p className="promo-subtitle" style={{ color: T.textSecondary }}>
Step {draft.step} of {STEPS.length} — {STEPS[draft.step - 1]}
</p>
</div>
<GhostButton onClick={() => setConfirmDiscard(true)}>
<Trash2 size={16} /> Discard draft
</GhostButton>
</div>

<div className="promo-container">
{/* ============ WIZARD ============ */}
<div className="np-wizard">
{/* Stepper — completed = green + white check, current = navy, upcoming = ghost */}
<ol className="np-stepper" aria-label="Promotion setup progress">
{STEPS.map((label, i) => {
const n = i + 1;
/* Every step before the current one is completed. */
const done = n < draft.step;
const current = n === draft.step;
return (
<li key={label} className="np-stepper__item">
<span
className="np-stepper__circle"
style={
done
? { background: T.progressActive, color: T.white, border: `2px solid ${T.progressActive}`, borderRadius: T.radiusPill }
: current
? { background: T.navy, color: T.white, border: `2px solid ${T.navy}`, borderRadius: T.radiusPill }
: { background: T.white, color: T.textSecondary, border: `1px solid ${T.border}`, borderRadius: T.radiusPill }
}
aria-current={current ? 'step' : undefined}
>
{done ? <Check size={14} /> : n}
</span>
<span
className="np-stepper__label"
style={{ color: current ? T.textPrimary : T.textSecondary, fontWeight: current ? 600 : 400 }}
>
{label}
</span>
{n < STEPS.length && <span className="np-stepper__line" style={{ background: T.border }} />}
</li>
);
})}
</ol>

<div className="np-card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
{/* ---------- STEP 1 — BASICS ---------- */}
{draft.step === 1 && (
<Step1Basics
draft={draft}
errors={errors}
onEdit={setField}
onApplyTemplate={applyTemplate}
onDetachTemplate={detachTemplate}
/>
)}

{/* ---------- STEP 2 — QUALIFICATION ---------- */}
{draft.step === 2 && <Step2Qualification draft={draft} errors={errors} onEdit={setField} />}


{/* ---------- STEP 3 — AWARD ---------- */}
{draft.step === 3 && (
<>
<h2 className="np-card__heading" style={{ color: T.textPrimary }}>Award</h2>
<div className="np-form-grid">
<Field label="Reward type" full>
<div className="np-radio-group" role="radiogroup" aria-label="Reward type">
{([
['freebet', 'Freebet'],
['cash', 'Cash'],
] as const).map(([value, label]) => (
<label key={value} className="np-radio-row" style={{ color: T.textPrimary }}>
<input
type="radio"
name="rewardType"
checked={draft.rewardType === value}
onChange={() => setField('rewardType', value)}
style={{ accentColor: T.navy }}
/>
{label}
</label>
))}
</div>
</Field>

{draft.rewardType === 'freebet' && (
<>
<Field label="Count" required error={errors.freebetCount}>
<input
type="number"
min="1"
className="np-input"
style={inputStyle(errors.freebetCount)}
value={draft.freebetCount}
aria-label="Freebet count"
onChange={(e) => setField('freebetCount', e.target.value)}
/>
</Field>
<Field label="Value each" required error={errors.freebetValue}>
{moneyInput(draft.freebetValue, (v) => setField('freebetValue', v), { error: errors.freebetValue, placeholder: '0.00', ariaLabel: 'Freebet value each' })}
</Field>
<Field label="Expiry (hours)">
<input
type="number"
min="1"
className="np-input"
style={inputStyle()}
value={draft.freebetExpiryHours}
aria-label="Freebet expiry in hours"
onChange={(e) => setField('freebetExpiryHours', e.target.value)}
/>
</Field>
</>
)}


{draft.rewardType === 'cash' && (
<Field label="Payout" full>
<div className="np-radio-group" role="radiogroup" aria-label="Payout mode" style={{ marginBottom: 12 }}>
{([
['fixed', 'Fixed amount'],
['tiers', 'Tier matrix'],
] as const).map(([value, label]) => (
<label key={value} className="np-radio-row" style={{ color: T.textPrimary }}>
<input
type="radio"
name="payoutMode"
checked={draft.payoutMode === value}
onChange={() => setField('payoutMode', value)}
style={{ accentColor: T.navy }}
/>
{label}
</label>
))}
</div>
{draft.payoutMode === 'fixed' ? (
<div style={{ maxWidth: 280 }}>
{moneyInput(draft.fixedAmount, (v) => setField('fixedAmount', v), { error: errors.fixedAmount, placeholder: '0.00', ariaLabel: 'Fixed payout amount' })}
{errors.fixedAmount && <p className="np-error" role="alert" style={{ color: T.destructive }}>{errors.fixedAmount}</p>}
</div>
) : (
<>
<table className="np-tier-table">
<thead>
<tr>
<th style={{ color: T.textSecondary }}>Odds threshold ≥</th>
<th style={{ color: T.textSecondary }}>Multiplier ×</th>
<th aria-label="Row actions" />
</tr>
</thead>
<tbody>
{draft.tiers.map((tier, i) => (
<tr key={i}>
<td>
<input
type="number"
min="0"
step="0.01"
className="np-input"
style={inputStyle()}
value={tier.odds}
aria-label={`Tier ${i + 1} odds threshold`}
onChange={(e) => updateTier(i, { odds: e.target.value })}
/>
</td>
<td>
<input
type="number"
min="0"
step="0.01"
className="np-input"
style={inputStyle()}
value={tier.multiplier}
aria-label={`Tier ${i + 1} multiplier`}
onChange={(e) => updateTier(i, { multiplier: e.target.value })}
/>
</td>
<td>
<button
type="button"
className="promo-icon-btn"
style={{ color: T.textSecondary, borderRadius: T.radiusSm }}
aria-label={`Remove tier ${i + 1}`}
onClick={() => removeTier(i)}
onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
>
<Trash2 size={14} />
</button>
</td>
</tr>
))}
</tbody>
</table>
<div style={{ marginTop: 12 }}>
<GhostButton small onClick={addTier}>
<Plus size={14} /> Add row
</GhostButton>
</div>
<div className="np-form-grid" style={{ marginTop: 16 }}>
<Field label="Payout cap">
{moneyInput(draft.payoutCap, (v) => setField('payoutCap', v), { placeholder: '0.00', ariaLabel: 'Payout cap in ZMW' })}
</Field>
</div>
</>
)}
</Field>
)}


{/* Caps — both reward types */}
<Field label="Max awards per day">
<input
type="number"
min="0"
className="np-input"
style={inputStyle()}
value={draft.maxAwardsPerDay}
aria-label="Max awards per day"
onChange={(e) => setField('maxAwardsPerDay', e.target.value)}
/>
</Field>
<Field label="Lifetime award count">
<input
type="number"
min="0"
className="np-input"
style={inputStyle()}
value={draft.lifetimeCount}
aria-label="Lifetime award count"
onChange={(e) => setField('lifetimeCount', e.target.value)}
/>
</Field>
<Field label="Lifetime award value">
{moneyInput(draft.lifetimeValue, (v) => setField('lifetimeValue', v), { placeholder: '0.00', ariaLabel: 'Lifetime award value in ZMW' })}
</Field>

<Field label="Credit timing" full>
<div className="np-radio-group" role="radiogroup" aria-label="Credit timing">
{([
['instant', 'Instant'],
['next-day', 'Next day at'],
['manual', 'Manual'],
] as const).map(([value, label]) => (
<label key={value} className="np-radio-row" style={{ color: T.textPrimary }}>
<input
type="radio"
name="creditTiming"
checked={draft.creditTiming === value}
onChange={() => setField('creditTiming', value)}
style={{ accentColor: T.navy }}
/>
{label}
{value === 'next-day' && (
<input
type="time"
className="np-input"
style={{ ...inputStyle(), width: 110 }}
value={draft.creditTime}
disabled={draft.creditTiming !== 'next-day'}
aria-label="Next-day credit time"
onChange={(e) => setField('creditTime', e.target.value)}
/>
)}
</label>
))}
</div>
</Field>
</div>

{draft.rewardType === 'freebet' && (
<div className="np-section" style={{ borderTop: `1px solid ${T.border}` }}>
<h3 className="np-section__title" style={{ color: T.textPrimary }}>Usage rules</h3>
<div className="np-form-grid">
<Field label="Restricted to product">
<select
className="np-input"
style={inputStyle()}
value={draft.restrictedProduct}
onChange={(e) => setField('restrictedProduct', e.target.value)}
>
<option value="">Not restricted</option>
{VERTICALS.map((v) => (
<option key={v} value={v}>{v}</option>
))}
</select>
</Field>
</div>
<div className="np-toggle-row" style={{ color: T.textPrimary }}>
<span>Whole-stake use only</span>
<Toggle checked={draft.wholeStakeOnly} onChange={(v) => setField('wholeStakeOnly', v)} ariaLabel="Whole-stake use only" />
</div>
<div className="np-toggle-row" style={{ color: T.textPrimary }}>
<span>Winnings exclude stake</span>
<Toggle checked={draft.winningsExcludeStake} onChange={(v) => setField('winningsExcludeStake', v)} ariaLabel="Winnings exclude stake" />
</div>
</div>
)}

<div className="np-section" style={{ borderTop: `1px solid ${T.border}` }}>
<div className="np-toggle-row" style={{ color: T.textPrimary }}>
<span>Withhold if another new-customer offer applied</span>
<Toggle checked={draft.withholdOtherOffers} onChange={(v) => setField('withholdOtherOffers', v)} ariaLabel="Withhold if another new-customer offer applied" />
</div>
</div>
</>
)}

{/* ---------- STEP 4 — BUDGET ---------- */}
{draft.step === 4 && (
<>
<h2 className="np-card__heading" style={{ color: T.textPrimary }}>Budget</h2>
<div className="np-form-grid">
<Field label="Budget amount" hint="Optional">
{moneyInput(draft.budget, (v) => setField('budget', v), { placeholder: '0.00', ariaLabel: 'Budget amount in ZMW' })}
</Field>
<Field label="Alert threshold %">
<input
type="number"
min="1"
max="100"
className="np-input"
style={inputStyle()}
value={draft.alertThreshold}
aria-label="Alert threshold percent"
onChange={(e) => setField('alertThreshold', e.target.value)}
/>
</Field>
<Field label="Alert recipients" full>
<input
className="np-input"
style={inputStyle()}
value={draft.alertRecipients}
placeholder="e.g. trading@betika.zm, CRM team"
onChange={(e) => setField('alertRecipients', e.target.value)}
/>
</Field>
</div>
<div className="np-notice" style={{ background: T.offWhite, borderRadius: T.radiusSm, marginTop: 20 }}>
<Info size={16} style={{ color: T.textSecondary }} />
<span style={{ color: T.textPrimary }}>
Budgets alert the business when spend reaches the threshold. They never block awarding.
</span>
</div>
</>
)}


{/* ---------- STEP 5 — SCHEDULE ---------- */}
{draft.step === 5 && (
<>
<h2 className="np-card__heading" style={{ color: T.textPrimary }}>Schedule</h2>
<div className="np-form-grid">
<Field label="Start date" required error={errors.startDate}>
<input
type="date"
className="np-input"
style={inputStyle(errors.startDate)}
value={draft.startDate}
aria-label="Start date"
onChange={(e) => setField('startDate', e.target.value)}
/>
</Field>
<Field label="Start time" required error={errors.startTime}>
<input
type="time"
className="np-input"
style={inputStyle(errors.startTime)}
value={draft.startTime}
aria-label="Start time"
onChange={(e) => setField('startTime', e.target.value)}
/>
</Field>
<Field label="End" full>
<div className="np-radio-group" role="radiogroup" aria-label="End">
<label className="np-radio-row" style={{ color: T.textPrimary }}>
<input
type="radio"
name="endMode"
checked={draft.endMode === 'date'}
onChange={() => setField('endMode', 'date')}
style={{ accentColor: T.navy }}
/>
On date
<input
type="date"
className="np-input"
style={{ ...inputStyle(errors.endDate), width: 150 }}
value={draft.endDate}
disabled={draft.endMode !== 'date'}
aria-label="End date"
onChange={(e) => setField('endDate', e.target.value)}
/>
<input
type="time"
className="np-input"
style={{ ...inputStyle(errors.endTime), width: 110 }}
value={draft.endTime}
disabled={draft.endMode !== 'date'}
aria-label="End time"
onChange={(e) => setField('endTime', e.target.value)}
/>
</label>
<label className="np-radio-row" style={{ color: T.textPrimary }}>
<input
type="radio"
name="endMode"
checked={draft.endMode === 'ongoing'}
onChange={() => setField('endMode', 'ongoing')}
style={{ accentColor: T.navy }}
/>
Ongoing
</label>
</div>
{(errors.endDate || errors.endTime) && (
<p className="np-error" role="alert" style={{ color: T.destructive }}>{errors.endDate || errors.endTime}</p>
)}
</Field>
<Field label="Timezone" full>
<input
className="np-input"
style={{ ...inputStyle(), background: T.offWhite }}
value="Africa/Lusaka (CAT)"
readOnly
disabled
aria-label="Timezone"
/>
</Field>
</div>
</>
)}


{/* ---------- STEP 6 — CONTENT (CMS) ---------- */}
{draft.step === 6 && (
<>
<h2 className="np-card__heading" style={{ color: T.textPrimary }}>Content</h2>

{/* 1 — TILE */}
<div className="np-section" style={{ borderTop: 'none', marginTop: 12, paddingTop: 0 }}>
<h3 className="np-section__title" style={{ color: T.textPrimary }}>Tile</h3>
<Field
label="Short description"
required
error={errors.shortDescription}
hint="One sentence shown on the promo tile. 'Read More' is added automatically — do not include it."
full
>
<textarea
className="np-input np-textarea"
style={inputStyle(errors.shortDescription)}
value={draft.shortDescription}
maxLength={80}
aria-label="Short description"
onChange={(e) => setField('shortDescription', e.target.value.slice(0, 80))}
/>
<span className="np-hint" style={{ color: draft.shortDescription.length >= 80 ? T.destructive : T.textSecondary }}>
{draft.shortDescription.length}/80
</span>
</Field>
</div>

{/* 2 — BANNERS */}
<div className="np-section" style={{ borderTop: `1px solid ${T.border}` }}>
<h3 className="np-section__title" style={{ color: T.textPrimary }}>Banners</h3>
<p className="np-hint" style={{ color: T.textSecondary }}>
Placements beyond the promotions page must be specified in business requirements.
</p>
<div className="np-slot-grid">
{draft.bannerSlots.map((slot) => (
<div key={slot.id} style={{ position: 'relative' }}>
<label
className="np-slot"
style={{ border: `1px dashed ${T.ghostBorder}`, borderRadius: T.radiusSm, background: T.white }}
onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
onMouseLeave={(e) => (e.currentTarget.style.background = T.white)}
>
<input
type="file"
accept="image/*"
style={{ display: 'none' }}
aria-label={`Upload banner — ${slot.label}`}
onChange={(e) => pickBanner(slot.id, e.target.files?.[0] ?? null)}
/>
<span className="np-slot__label" style={{ color: T.textPrimary }}>{slot.label}</span>
{slot.kind === 'extra' && (
<span style={{ display: 'flex', gap: 8 }} onClick={(e) => e.preventDefault()}>
<select
className="np-input"
style={inputStyle()}
value={slot.placement}
aria-label="Placement"
onChange={(e) => updateSlot(slot.id, { placement: e.target.value })}
>
{EXTRA_PLACEMENTS.map((p) => (
<option key={p} value={p}>{p}</option>
))}
</select>
<select
className="np-input"
style={inputStyle()}
value={slot.device}
aria-label="Device"
onChange={(e) => updateSlot(slot.id, { device: e.target.value })}
>
{DEVICES.map((d) => (
<option key={d} value={d}>{d}</option>
))}
</select>
</span>
)}
<span className="np-slot__meta" style={{ color: T.textSecondary }}>
{slot.preview ? (
// eslint-disable-next-line @next/next/no-img-element -- local FileReader preview, no optimization needed
<img className="np-slot__thumb" src={slot.preview} alt="" style={{ borderRadius: T.radiusXs, border: `1px solid ${T.border}` }} />
) : (
<ImagePlus size={16} />
)}
{slot.fileName || 'Upload image'}
</span>
</label>
{slot.kind === 'extra' && (
<button
type="button"
className="promo-icon-btn"
style={{ position: 'absolute', top: 8, right: 8, color: T.textSecondary, borderRadius: T.radiusSm }}
aria-label={`Remove ${slot.label}`}
onClick={() => removeSlot(slot.id)}
onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
>
<X size={14} />
</button>
)}
</div>
))}
</div>
<div style={{ marginTop: 12 }}>
<GhostButton small onClick={addSlot}>
<Plus size={14} /> Add placement
</GhostButton>
</div>
</div>


{/* 3 — TERMS & CONDITIONS */}
<div className="np-section" style={{ borderTop: `1px solid ${T.border}` }}>
<h3 className="np-section__title" style={{ color: T.textPrimary }}>Terms &amp; Conditions</h3>
<div className="np-slot-grid" style={{ gridTemplateColumns: '1fr' }}>
<label
className="np-slot"
style={{ border: `1px dashed ${T.ghostBorder}`, borderRadius: T.radiusSm, background: T.white }}
onMouseEnter={(e) => (e.currentTarget.style.background = T.offWhite)}
onMouseLeave={(e) => (e.currentTarget.style.background = T.white)}
>
<input
type="file"
style={{ display: 'none' }}
aria-label="Upload approved T&Cs file"
onChange={(e) => pickTcs(e.target.files?.[0] ?? null)}
/>
<span className="np-slot__label" style={{ color: T.textPrimary }}>Approved T&amp;Cs file</span>
<span className="np-slot__meta" style={{ color: T.textSecondary }}>
{draft.tcsFileName ? <FileText size={16} /> : <Upload size={16} />}
{draft.tcsFileName || 'Upload file'}
</span>
</label>
</div>
<Field label="T&Cs summary" full>
<textarea
className="np-input np-textarea"
style={inputStyle()}
value={draft.tcsSummary}
placeholder="Short internal summary of the key terms (optional)"
aria-label="T&Cs summary"
onChange={(e) => setField('tcsSummary', e.target.value)}
/>
</Field>
{showTcsWarning && (
<div className="np-notice" style={{ background: T.offWhite, borderRadius: T.radiusSm, marginTop: 12 }}>
<TriangleAlert size={16} style={{ color: T.destructive }} />
<span style={{ color: T.textPrimary }}>
Upload the final signed-off version. For cashback promotions, ensure the cash-out exclusion clause is included.
</span>
</div>
)}
</div>

{/* 4 — VISIBILITY PREVIEW */}
<div className="np-section" style={{ borderTop: `1px solid ${T.border}` }}>
<h3 className="np-section__title" style={{ color: T.textPrimary }}>Visibility preview</h3>
<p className="np-hint" style={{ color: T.textSecondary }}>How the promo tile appears to players.</p>
<div
className="np-preview-tile"
style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd, marginTop: 12 }}
>
<p className="np-preview-tile__name" style={{ color: T.textPrimary }}>
{draft.name.trim() || 'Promotion name'}
</p>
<p className="np-preview-tile__desc" style={{ color: T.textSecondary }}>
{draft.shortDescription || 'Short description will appear here.'}
</p>
<p className="np-preview-tile__more" style={{ color: T.navy }}>Read More</p>
</div>
</div>
</>
)}


{/* ---------- STEP 7 — REVIEW ---------- */}
{draft.step === 7 && (
<>
<h2 className="np-card__heading" style={{ color: T.textPrimary }}>Review</h2>
<div className="np-review-grid">
<ReviewSection
title="Basics"
step={1}
onEdit={goToStep}
rows={[
['Name', draft.name.trim() || '—'],
['Type', typeLabel(draft)],
['Product vertical', draft.vertical || '—'],
]}
/>
<ReviewSection
title="Qualification"
step={2}
onEdit={goToStep}
rows={[
['Qualifying bet', `${qualificationRules.length} rule(s) across ${draft.qualification.triggers.length} trigger(s)`],
...draft.qualification.triggers.flatMap((trigger, index): [string, string][] => {
const visibleRules = trigger.rules.filter((rule) => !BET_RESTRICTIONS.some((restriction) => restriction.param === rule.param));
return [
[
`Trigger ${index + 1}${index > 0 ? ' (OR)' : ''}`,
`${catalogEventLabel(trigger.eventId)} — ${visibleRules.length > 0 ? visibleRules.map(qualificationRuleSummary).join(' AND ') : 'No conditions'}`,
],
...qualificationRestrictionRows(trigger.rules, index),
];
}),
[
'How often',
draft.qualification.counting.length > 0
? draft.qualification.counting.map(qualificationRuleSummary).join(' AND ')
: 'Each qualifying event (subject to award limits)',
],
['Channels', hasChannelRule ? 'As defined by Channel conditions on the triggers above' : 'All (site-wide)'],
[
'Eligibility',
draft.qualification.eligibility.audience === 'all'
? 'All players'
: `New customers within ${draft.qualification.eligibility.windowDays ?? '—'} days of registration${draft.qualification.eligibility.nonConsecutive ? ' (days need not be consecutive)' : ''}`,
],

]}
/>

<ReviewSection
title="Award"
step={3}
onEdit={goToStep}
rows={[
['Reward type', draft.rewardType === 'freebet' ? 'Freebet' : 'Cash'],
...(draft.rewardType === 'freebet'
? ([
['Freebets', `${draft.freebetCount || '—'} × K ${draft.freebetValue || '—'}`],
['Expiry', `${draft.freebetExpiryHours || '—'} hours`],
] as [string, string][])
: ([
['Payout', draft.payoutMode === 'fixed' ? `Fixed — K ${draft.fixedAmount || '—'}` : `Tier matrix (${draft.tiers.length} rows)`],
...(draft.payoutMode === 'tiers' ? ([['Payout cap', draft.payoutCap ? `K ${draft.payoutCap}` : '—']] as [string, string][]) : []),
] as [string, string][])),
[
'Caps',
`${draft.maxAwardsPerDay || '—'}/day · ${draft.lifetimeCount || '—'} lifetime · K ${draft.lifetimeValue || '—'} lifetime value`,
],
['Credit timing', draft.creditTiming === 'instant' ? 'Instant' : draft.creditTiming === 'next-day' ? `Next day at ${draft.creditTime || '14:00'}` : 'Manual'],
...(draft.rewardType === 'freebet'
? ([
[
'Usage rules',
[
draft.restrictedProduct ? `Restricted to ${draft.restrictedProduct}` : 'No product restriction',
draft.wholeStakeOnly ? 'Whole-stake use only' : '',
draft.winningsExcludeStake ? 'Winnings exclude stake' : '',
].filter(Boolean).join('; '),
],
] as [string, string][])
: []),
['Withhold other offers', draft.withholdOtherOffers ? 'On' : 'Off'],
]}
/>
<ReviewSection
title="Budget"
step={4}
onEdit={goToStep}
rows={[
['Budget amount', draft.budget ? `K ${draft.budget}` : '—'],
['Alert threshold', `${draft.alertThreshold || '90'}%`],
['Alert recipients', draft.alertRecipients || '—'],
]}
/>
<ReviewSection
title="Schedule"
step={5}
onEdit={goToStep}
rows={[
['Start', draft.startDate ? `${draft.startDate} ${draft.startTime || ''}`.trim() : '—'],
['End', draft.endMode === 'ongoing' ? 'Ongoing' : `${draft.endDate || '—'} ${draft.endTime || ''}`.trim()],
['Timezone', 'Africa/Lusaka (CAT)'],
]}
/>
<ReviewSection
title="Content"
step={6}
onEdit={goToStep}
badge={
contentIncomplete ? (
<Badge color={T.yellow} textColor={T.textPrimary}>
<TriangleAlert size={12} style={{ marginRight: 4 }} />
Content incomplete — required before publish
</Badge>
) : undefined
}
rows={[
['Short description', draft.shortDescription || '—'],
['Banners', `${bannersFilled}/${draft.bannerSlots.length} slots filled`],
['T&Cs', draft.tcsFileName || 'Not uploaded'],
]}
/>
</div>
</>
)}
</div>


{/* Footer — Back / Continue per step; Review adds Save draft + Submit */}
<div className="np-wizard-footer">
<GhostButton onClick={() => (draft.step === 1 ? router.push('/admin/promotions') : goToStep(draft.step - 1))}>
<ChevronLeft size={16} /> Back
</GhostButton>
<div className="np-wizard-footer__group">
{draft.step === STEPS.length ? (
<>
<GhostButton onClick={saveDraft}>Save draft</GhostButton>
<PrimaryButton onClick={() => setConfirmSubmit(true)}>
<CircleCheck size={16} /> Submit for approval
</PrimaryButton>
</>
) : (
<PrimaryButton onClick={goContinue}>Continue</PrimaryButton>
)}
</div>
</div>
</div>
</div>

{/* Submit confirm — confirm-before-commit (maker-checker). */}
{confirmSubmit && (
<div role="dialog" aria-modal="true" aria-labelledby="np-submit-title">
<div className="promo-modal__scrim" style={{ background: T.scrim }} onClick={() => setConfirmSubmit(false)} />
<div className="promo-modal__card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}>
<h2 id="np-submit-title" className="promo-modal__title" style={{ color: T.textPrimary }}>
Submit {draft.name.trim() || 'this promotion'} for approval?
</h2>
<p className="promo-modal__body" style={{ color: T.textSecondary }}>
This will submit the promotion for checker approval. It will not go live until approved.
</p>
<div className="promo-modal__actions">
<GhostButton onClick={() => setConfirmSubmit(false)}>Cancel</GhostButton>
<PrimaryButton onClick={doSubmit}>Submit for approval</PrimaryButton>
</div>
</div>
</div>
)}

{/* Discard confirm — destructive-adjacent: clears the persisted draft. */}
{confirmDiscard && (
<div role="dialog" aria-modal="true" aria-labelledby="np-discard-title">
<div className="promo-modal__scrim" style={{ background: T.scrim }} onClick={() => setConfirmDiscard(false)} />
<div className="promo-modal__card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}>
<h2 id="np-discard-title" className="promo-modal__title" style={{ color: T.textPrimary }}>
Discard this draft?
</h2>
<p className="promo-modal__body" style={{ color: T.textSecondary }}>
All entered details will be removed. This cannot be undone.
</p>
<div className="promo-modal__actions">
<GhostButton onClick={() => setConfirmDiscard(false)}>Keep editing</GhostButton>
<GhostButton onClick={doDiscard}>
<Trash2 size={16} /> Discard draft
</GhostButton>
</div>
</div>
</div>
)}
</div>
);
}

/* Review summary card with an Edit link jumping back to its step. */
function ReviewSection({
title, step, onEdit, rows, badge,
}: {
title: string;
step: number;
onEdit: (step: number) => void;
rows: [string, string][];
badge?: ReactNode;
}) {
return (
<div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: 20 }}>
<div className="np-review-card__head">
<h3 className="np-section__title" style={{ color: T.textPrimary, margin: 0 }}>{title}</h3>
<button type="button" className="np-link-btn" style={{ color: T.navy }} onClick={() => onEdit(step)}>
Edit
</button>
</div>
{badge && <div style={{ marginBottom: 12 }}>{badge}</div>}
<div className="np-review-rows">
{rows.map(([label, value]) => (
<div key={label}>
<div className="np-review-label" style={{ color: T.textSecondary }}>{label}</div>
<div className="np-review-value" style={{ color: T.textPrimary }}>{value}</div>
</div>
))}
</div>
</div>
);
}

