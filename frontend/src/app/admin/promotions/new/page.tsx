'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
Check, ChevronLeft, CircleCheck, FileText, ImagePlus, Info, LayoutTemplate, LogOut, Plus, Save, Trash2, TriangleAlert, Upload, X,
} from 'lucide-react';
import '../promotions.css';
import './new.css';
import T from '@/theme/tokens';
import { Badge, Checkbox, DateTimeField, GhostButton, PrimaryButton, TimeField, Toggle, parseIsoDateTime, toIsoDate, toIsoTime } from '@/components/ui';
import { cloneNotifications, loadPromotions, nextPromoId, setListNotice, upsertPromotion } from '@/lib/promotions';
import type { NotificationTrigger, Notifications, Promo } from '@/lib/promotions';
import { DRAFT_STEP_COUNT, deleteDraft, formatSavedAgo, loadDraft, sanitizeDraft, saveDraft as storeDraft } from '@/lib/promotions/draftStore';
import { NOTIFICATION_CHANNELS, NOTIFICATION_CHANNEL_LABELS, NOTIFICATION_PLACEHOLDERS, NOTIFICATION_TRIGGER_LABELS, SMS_SEGMENT_LENGTH, channelSummary, isNotificationChannelAvailable, notificationChannelSummary, normalizeChannels, normalizeNotifications, placeholderToken, smsSegments } from '@/lib/promotions';
import { BET_RESTRICTIONS, catalogEventLabel } from '@/data/event-catalog';
import { isRangeOperator, isZeroArityOperator, QUALIFICATION_OPERATOR_VALUES } from '@/data/operator-catalog';
import { getPromotionType } from '@/data/promotion-templates';
import type { TemplateId, TierRow } from '@/data/promotion-templates';
import { DRAFT_KEY, TRIGGER_JOIN_LABELS, baseDraft, formatAwardCap, sanitizeDraftChannels, sanitizeQualification, stakePercentageSummary, templateDraft, triggerChainSummary, validateBasics, validateNotifications, validateQualification, validateStakeBack } from './draft';
import type { BannerSlot, PromotionDraft, Trigger, TriggerRule } from './draft';
import { STEP, STEPS, clampStep } from './steps';
import { features } from '@/config/features';
import { Field, inputStyle } from './fields';
import { Step1Basics } from './Step1Basics';
import { Step2Qualification } from './Step2Qualification';

/* Draft model lives in ./draft: a single PromotionDraft autosaved to
 * localStorage (DRAFT_KEY) as the session's working copy, prefilled from the
 * template catalog. Explicit Save draft / Save and exit additionally write it
 * to the reference-keyed store (@/lib/promotions/draftStore, `promo-drafts:v1`)
 * and upsert a Draft row on the list; `?ref=PR-xxx` resumes from that store. */

/* Wizard steps come from ./steps (shared with the draft store): Budget (BR-6) and
 * Content are feature-gated, STEP.<id> is 0 when hidden, and the stepper renumbers. */
const NAME_INPUT_ID = 'np-field-name';
/** Draft keys that never count as an unsaved edit (navigation + persistence metadata). */
const VOLATILE_KEYS: (keyof PromotionDraft)[] = ['step', 'dirty', 'reference', 'lastStep', 'lastStepId', 'savedAt', 'status'];

/** Serialises the editable part of a draft; equal fingerprints mean "nothing to save". */
function fingerprint(d: PromotionDraft): string {
const editable: Partial<PromotionDraft> = { ...d };
for (const key of VOLATILE_KEYS) delete editable[key];
return JSON.stringify(editable);
}

const VERTICALS = ['Sportsbook', 'Aviator', 'Casino', 'Crash', 'Virtuals'];
const EXTRA_PLACEMENTS = ['Homepage', 'Casino', 'Crash'];
const DEVICES = ['Desktop', 'Mobile'];

/* Template prefills and seed data come from src/data/promotion-templates.ts
 * (see draft.ts: templateDraft overlays a full prefill on a fresh base draft). */

/** Review readback follows operator arity, without leaking stale range bounds. */
function qualificationRuleSummary(rule: TriggerRule): string {
  const label = `${rule.param} ${rule.operator}`;
  if (isZeroArityOperator(rule.operator)) return label;
  if (isRangeOperator(rule.operator)) return `${label} ${rule.value || '·'} – ${rule.value2 || '·'}`;
  return `${label} ${rule.value || '·'}`;
}

/** Restrictions are one promotion-wide set (edited once in Step 2) stored as an exclusion rule on every trigger, so they read back once. */
function qualificationRestrictionRows(triggers: Trigger[]): [string, string][] {
  const rules = triggers.flatMap((trigger) => trigger.rules);
  const active = BET_RESTRICTIONS.filter((restriction) => rules.some((rule) =>
    rule.param === restriction.param && rule.operator === QUALIFICATION_OPERATOR_VALUES.equals && rule.value === 'No',
  ));
  const rows: [string, string][] = active.length > 0
    ? [['Restrictions', `Excluded: ${active.map((restriction) => restriction.summary).join(', ')}`]]
    : [];
  for (const restriction of BET_RESTRICTIONS) {
    if (!active.includes(restriction)) {
      rows.push([`${restriction.param} warning`, `⚠ ${restriction.warning}`]);
    }
  }
  return rows;
}

/* Per-step required-field validation → inline errors keyed by field. */
function validateStep(d: PromotionDraft, step: number): Record<string, string> {
const e: Record<string, string> = {};
if (step === STEP.basics) return validateBasics(d);
if (step === STEP.qualification) return validateQualification(d);
if (step === STEP.award) {
if (d.rewardType === 'freebet') {
if (!d.freebetCount || Number(d.freebetCount) <= 0) e.freebetCount = 'Freebet count is required.';
if (!d.freebetValue || Number(d.freebetValue) <= 0) e.freebetValue = 'Freebet value is required.';
} else if (d.payoutMode === 'fixed' && (!d.fixedAmount || Number(d.fixedAmount) <= 0)) {
e.fixedAmount = 'Fixed amount is required.';
}
/* Stake-back fields (percentage of stake / max value per award). */
Object.assign(e, validateStakeBack(d));
}
if (step === STEP.schedule) {
if (!d.startDate) e.startDate = 'Start date is required.';
if (!d.startTime) e.startTime = 'Start time is required.';
if (d.endMode === 'date') {
if (!d.endDate) e.endDate = 'End date is required.';
if (!d.endTime) e.endTime = 'End time is required.';
}
}
if (step === STEP.content) {
if (!d.shortDescription.trim()) e.shortDescription = 'Short description is required.';
}
if (step === STEP.notifications) return validateNotifications(d);
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

/**
 * `reference` is the row id: the draft's stable reference once one exists,
 * otherwise a fresh `nextPromoId()`. When a row with that id already exists
 * (re-saving a draft, or a seeded Draft such as PR-004) its list-only fields
 * (providerCode, spend) carry over so the upsert replaces, never duplicates.
 */
function buildPromo(d: PromotionDraft, status: 'draft' | 'pending', reference: string): Promo {
const existing = loadPromotions().find((p) => p.id === reference);
/* The seeded type label ("Odds Boost") survives while the wizard type is still unset. */
const type = d.type ? typeLabel(d) : existing?.type ?? typeLabel(d);
return {
id: reference,
name: d.name.trim() || 'Untitled promotion',
type,
/* Zambia is implicit in this prototype (no Market field in the wizard). */
market: existing?.market ?? 'Zambia',
schedule: scheduleLabel(d),
/* BR-6 budget is only captured when the Budget step is enabled. */
budget: features.budgets && d.budget ? Number(d.budget) : existing?.budget ?? null,
spend: existing?.spend ?? null,
status,
channels: normalizeChannels(d.channels),
notifications: cloneNotifications(d.notifications),
/* Step 1 "Product vertical" select; empty = cross-product. */
vertical: d.vertical || existing?.vertical || null,
/* PLACEHOLDER: the wizard captures no provider yet (Settings owns provider codes). */
providerCode: existing?.providerCode ?? null,
};
}

/* ------------------------------------------------------------------ */
/* Small page-level form helpers (composition only; primitives come   */
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


/* useSearchParams (the `?ref=` resume route) needs a Suspense boundary for static rendering. */
export default function NewPromotionPage() {
return (
<Suspense fallback={null}>
<NewPromotionWizard />
</Suspense>
);
}

/** Where the author was trying to go when the unsaved-changes guard stopped them. */
type LeaveIntent = { kind: 'route'; href: string } | { kind: 'back' };

function NewPromotionWizard() {
const router = useRouter();
const searchParams = useSearchParams();
const resumeRef = searchParams.get('ref');
const [draft, setDraft] = useState<PromotionDraft>(() => baseDraft());
const [errors, setErrors] = useState<Record<string, string>>({});
const [confirmSubmit, setConfirmSubmit] = useState(false);
const [confirmDiscard, setConfirmDiscard] = useState(false);
/* Save / resume state. `savedFingerprint` is the clean baseline the live draft is
 * compared against: the pristine draft on a fresh start, the loaded copy on resume,
 * and the on-screen content after each explicit save. */
const [savedFingerprint, setSavedFingerprint] = useState<string | null>(null);
const [resumeNote, setResumeNote] = useState<string | null>(null);
const [leaveIntent, setLeaveIntent] = useState<LeaveIntent | null>(null);
const [focusName, setFocusName] = useState(false);
/* Re-render clock for "Saved N min ago" (ticks only while a save timestamp exists). */
const [now, setNow] = useState(() => Date.now());
const restored = useRef(false);
const leaving = useRef(false);
const sentinelPushed = useRef(false);
/* The pristine mount state. It is never persisted: under Strict Mode the persist effect
 * runs in the same commit as the restore effect (before the restored draft has rendered),
 * so writing it would clobber the saved draft — hidden Content fields included. */
const initialDraft = useRef(draft);

const currentFingerprint = useMemo(() => fingerprint(draft), [draft]);
const pristineFingerprint = useMemo(() => fingerprint(baseDraft()), []);
/* Unsaved = differs from the last save, or (never saved) from an untouched draft. */
const unsaved = savedFingerprint === null
? currentFingerprint !== pristineFingerprint
: currentFingerprint !== savedFingerprint;
/* Mirrored into a ref for the window/document listeners registered once on mount. */
const unsavedRef = useRef(unsaved);
useEffect(() => {
unsavedRef.current = unsaved;
}, [unsaved]);

/* Restore on load: `?ref=` resumes the reference-keyed saved draft; otherwise the
 * session's autosaved working copy (DRAFT_KEY) is rehydrated as before. */
useEffect(() => {
restored.current = true;
if (resumeRef) {
const stored = loadDraft(resumeRef);
if (stored) {
/* eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only hydration from localStorage */
setDraft(stored);
/* Resumed content is the clean baseline, whether or not it has been saved from the wizard before. */
setSavedFingerprint(fingerprint(stored));
setResumeNote(
stored.savedAt
? `Resumed ${stored.reference ?? resumeRef} from step ${stored.lastStep} of ${DRAFT_STEP_COUNT} · last saved ${formatSavedAgo(stored.savedAt)}.`
: `Editing ${resumeRef}. This draft has not been saved from the wizard yet; Save draft keeps it under the same reference.`,
);
} else {
setResumeNote(`Draft ${resumeRef} was not found. Starting a new promotion.`);
}
return;
}
try {
const raw = window.localStorage.getItem(DRAFT_KEY);
if (raw) {
/* Legacy drafts (preset-based flow) carried removed keys; strip them. */
const parsed = JSON.parse(raw) as Partial<PromotionDraft> & {
preset?: unknown;
id?: unknown;
market?: unknown;
provider?: unknown;
};
const { preset, id, market, provider, ...rest } = parsed;
void preset; void id; void market; void provider;
/* Legacy drafts may carry the removed 'custom' template; sanitize. */
const tpl = rest.template;
const scratch: PromotionDraft = {
...baseDraft(),
...rest,
/* A draft saved with more steps (e.g. Budget or Content enabled) must not land past the last step.
 * Content fields (shortDescription, bannerSlots, tcs*) stay on the draft via ...rest while hidden. */
step: clampStep(rest.step),
template: tpl === 'welcome_offer' || tpl === 'cashback' ? tpl : null,
/* Pre-rules-model drafts (flat fields / no primary trigger) fall back to an empty qualification. */
qualification: sanitizeQualification(rest.qualification),
channels: sanitizeDraftChannels(rest.channels),
notifications: normalizeNotifications(rest.notifications),
reference: typeof rest.reference === 'string' && rest.reference ? rest.reference : null,
};
setDraft(scratch);
/* A working copy that was explicitly saved earlier compares against its stored entry.
 * Both sides are sanitised first so key order / legacy shapes never read as an edit. */
const stored = scratch.reference ? loadDraft(scratch.reference) : null;
if (stored?.savedAt) {
const unchanged = fingerprint(sanitizeDraft(scratch, scratch.reference)) === fingerprint(stored);
setSavedFingerprint(unchanged ? fingerprint(scratch) : fingerprint(stored));
} else {
setSavedFingerprint(null);
}
}
} catch {
/* Corrupt draft: start clean. */
}
}, [resumeRef]);

/* Persist on every change (skipped until the restore effect has run and for the
 * untouched mount state, which would otherwise overwrite the stored draft). */
useEffect(() => {
if (!restored.current || draft === initialDraft.current) return;
try {
window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
} catch {
/* Quota errors are non-fatal for the prototype. */
}
}, [draft]);

/* "Saved N min ago" refreshes once a minute while a save timestamp is showing. */
useEffect(() => {
if (!draft.savedAt) return;
const id = window.setInterval(() => setNow(Date.now()), 60_000);
return () => window.clearInterval(id);
}, [draft.savedAt]);

/* Name-only save validation focuses the Name field (Step 1) after the step renders. */
useEffect(() => {
if (!focusName) return;
document.getElementById(NAME_INPUT_ID)?.focus();
/* eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot focus request reset */
setFocusName(false);
}, [focusName, draft.step]);

/* Exit guard. Browser reload/close: native beforeunload prompt. Browser back: a history
 * sentinel is pushed on mount so the first back press lands on the wizard again and can be
 * intercepted; the guard modal then offers Save and exit / Leave without saving. */
useEffect(() => {
const onBeforeUnload = (e: BeforeUnloadEvent) => {
if (!unsavedRef.current || leaving.current) return;
e.preventDefault();
};
window.addEventListener('beforeunload', onBeforeUnload);
return () => window.removeEventListener('beforeunload', onBeforeUnload);
}, []);

useEffect(() => {
/* The Next.js router state is carried over so popping onto the sentinel is a no-op for it. */
const pushSentinel = () => window.history.pushState({ ...window.history.state, npGuard: true }, '', window.location.href);
if (!sentinelPushed.current) {
sentinelPushed.current = true;
pushSentinel();
}
const onPopState = () => {
if (leaving.current) return;
if (unsavedRef.current) {
/* Re-arm the sentinel and ask; a confirmed leave goes back twice (sentinel + wizard). */
pushSentinel();
setLeaveIntent({ kind: 'back' });
} else {
window.history.back();
}
};
window.addEventListener('popstate', onPopState);
return () => window.removeEventListener('popstate', onPopState);
}, []);

/* In-app navigation guard: sidebar / any same-origin link click while unsaved. */
useEffect(() => {
const onClick = (e: MouseEvent) => {
if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
const anchor = (e.target as HTMLElement | null)?.closest('a[href]');
if (!anchor) return;
const href = anchor.getAttribute('href') ?? '';
if (!href.startsWith('/') || anchor.getAttribute('target') === '_blank') return;
if (!unsavedRef.current || leaving.current) return;
e.preventDefault();
setLeaveIntent({ kind: 'route', href });
};
document.addEventListener('click', onClick, true);
return () => document.removeEventListener('click', onClick, true);
}, []);

const update = (patch: Partial<PromotionDraft>) => setDraft((d) => ({ ...d, ...patch }));

const setField = <K extends keyof PromotionDraft>(key: K, value: PromotionDraft[K]) => {
update({ [key]: value, dirty: true } as Partial<PromotionDraft>);
setErrors((prev) => {
const next = { ...prev };
delete next[key as string];
/* Notification edits invalidate every per-trigger notification error. */
if (key === 'notifications') {
for (const errorKey of Object.keys(next)) {
if (errorKey.startsWith('notification:')) delete next[errorKey];
}
}
/* Qualification edits invalidate trigger and counting errors. */
if (key === 'qualification') {
for (const errorKey of Object.keys(next)) {
if (
            errorKey === 'triggers' || errorKey.startsWith('trigger:')
            || errorKey.startsWith('rule:') || errorKey.startsWith('counting:')
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

/* Template apply: full prefill over a fresh base draft. Step 1 owns the
 * dirty-guard and confirm panel, calling this only when committed. */
const applyTemplate = (id: TemplateId) => {
setErrors({});
setDraft(templateDraft(id));
};

/* Template detach: unlocks Promotion type but keeps every field value. */
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

/* Notification edits go through setField so the draft is marked dirty and
 * stale notification errors clear. */
const setNotificationRule = (trigger: NotificationTrigger, patch: Partial<Notifications[NotificationTrigger]>) =>
setField('notifications', { ...draft.notifications, [trigger]: { ...draft.notifications[trigger], ...patch } });

const addTier = () => setDraft((d) => ({ ...d, tiers: [...d.tiers, { odds: '', multiplier: '' }] }));
const removeTier = (i: number) => setDraft((d) => ({ ...d, tiers: d.tiers.filter((_, idx) => idx !== i) }));
const updateTier = (i: number, patch: Partial<TierRow>) =>
setDraft((d) => ({ ...d, tiers: d.tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }));

/* Leaves the wizard for good: the guards stand down and the scratch copy is cleared. */
const exitTo = (href: string) => {
leaving.current = true;
clearDraft();
router.push(href);
};

/**
 * Save draft (any step). Only the name is required to save — every other step
 * validation is deferred to Continue / Submit. Writes the reference-keyed store
 * and upserts the list row as Draft (never Pending approval). Returns the saved
 * draft, or null when the name is missing (Step 1 is shown with the Name focused).
 */
const persistDraft = (): PromotionDraft | null => {
if (!draft.name.trim()) {
setErrors({ name: 'Add a name to save this draft.' });
if (draft.step !== STEP.basics) update({ step: STEP.basics });
setFocusName(true);
return null;
}
const reference = draft.reference ?? nextPromoId();
const saved = storeDraft(draft, reference);
upsertPromotion(buildPromo(saved, 'draft', reference));
/* Keep the author's live edits object identity but adopt the persistence metadata. */
setDraft((d) => ({ ...d, reference, lastStep: saved.lastStep, lastStepId: saved.lastStepId, savedAt: saved.savedAt, dirty: false }));
/* Baseline = what is on screen now (the stored copy is a sanitised equivalent). */
setSavedFingerprint(currentFingerprint);
setNow(Date.now());
return saved;
};

const saveDraft = () => {
persistDraft();
};

/* Save and exit → same save, then back to the list with a notice. */
const saveAndExit = (href = '/admin/promotions') => {
const saved = persistDraft();
if (!saved) return;
setLeaveIntent(null);
setListNotice(`${saved.name.trim()} saved as draft (${saved.reference}).`);
exitTo(href);
};

/* Guard modal → Leave without saving: honour the original intent. */
const leaveWithoutSaving = () => {
if (!leaveIntent) return;
const intent = leaveIntent;
setLeaveIntent(null);
leaving.current = true;
clearDraft();
if (intent.kind === 'route') {
router.push(intent.href);
} else {
/* Two entries: the re-armed sentinel and the wizard itself. */
window.history.go(-2);
}
};

/* Back to the list from Step 1: guarded like any other exit. */
const requestExit = (href = '/admin/promotions') => {
if (unsaved) {
setLeaveIntent({ kind: 'route', href });
return;
}
exitTo(href);
};

/* Submit → confirm-before-commit → Pending approval row + toast. The stored draft is
 * removed: from here on the row belongs to the approval queue, not the wizard. */
const doSubmit = () => {
const reference = draft.reference ?? nextPromoId();
upsertPromotion(buildPromo(draft, 'pending', reference));
deleteDraft(reference);
setConfirmSubmit(false);
setListNotice('Promotion submitted for approval');
exitTo('/admin/promotions');
};

const doDiscard = () => {
setConfirmDiscard(false);
exitTo('/admin/promotions');
};

/* Save indicator copy: never saved / unsaved edits / saved N min ago. */
const saveState: { state: 'unsaved' | 'saved' | 'clean'; label: string } = unsaved
? { state: 'unsaved', label: 'Unsaved changes' }
: draft.savedAt
? { state: 'saved', label: `Saved ${formatSavedAgo(draft.savedAt, new Date(now))}` }
: { state: 'clean', label: 'Not saved yet' };

const bannersFilled = draft.bannerSlots.filter((s) => s.fileName).length;
const contentIncomplete = bannersFilled < draft.bannerSlots.length || !draft.tcsFileName;
  const qualificationRules = draft.qualification.triggers.flatMap((trigger) => trigger.rules);
/* Promotion-level channel eligibility (the Channels checkboxes on Qualification). */
const selectedChannelSummary = channelSummary(draft.channels);

const showTcsWarning = draft.template === 'cashback' || draft.qualification.triggers.length > 1;

return (
<div className="promo-page" style={{ background: T.offWhite }}>
{/* Top bar: Internal Tool Shell title + subtitle, discard action right */}
<div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
<div>
<h1 className="promo-title" style={{ color: T.textPrimary }}>
{draft.reference ? `Edit draft ${draft.reference}` : 'Create a promotion'}
</h1>
<p className="promo-subtitle" style={{ color: T.textSecondary }}>
Step {draft.step} of {STEPS.length} · {STEPS[draft.step - 1]}
</p>
</div>
<div className="promo-draft__topbar-actions">
{/* Save indicator: unsaved edits (amber) / saved N min ago (green) / not saved yet (muted) */}
<span
className="promo-draft__state"
data-testid="draft-save-state"
data-state={saveState.state}
role="status"
aria-live="polite"
style={{ color: saveState.state === 'saved' ? T.success : T.textSecondary }}
>
{/* Dot: attention yellow (same as the "Content incomplete" badge) / progress green / Draft grey */}
<span
className="promo-draft__dot"
aria-hidden="true"
style={{
background: saveState.state === 'unsaved' ? T.yellow : saveState.state === 'saved' ? T.progressActive : T.draft,
borderRadius: T.radiusPill,
}}
/>
{saveState.label}
</span>
<GhostButton onClick={() => setConfirmDiscard(true)}>
<Trash2 size={16} /> Discard draft
</GhostButton>
</div>
</div>

<div className="promo-container">
{/* ============ WIZARD ============ */}
<div className="np-wizard">
{/* Resume note: shown when the wizard opened from ?ref= (found, seeded, or missing). */}
{resumeNote && (
<div
className="promo-draft__resume"
data-testid="draft-resume-note"
role="status"
style={{ background: T.offWhite, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}
>
<Info size={16} aria-hidden="true" style={{ color: T.textSecondary }} />
<span style={{ color: T.textPrimary }}>{resumeNote}</span>
<button
type="button"
className="promo-draft__resume-close"
aria-label="Dismiss"
onClick={() => setResumeNote(null)}
style={{ color: T.textSecondary }}
>
<X size={14} />
</button>
</div>
)}

{/* Stepper: completed = green + white check, current = navy, upcoming = ghost */}
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
{/* ---------- STEP: BASICS ---------- */}
{draft.step === STEP.basics && (
<Step1Basics
draft={draft}
errors={errors}
onEdit={setField}
onApplyTemplate={applyTemplate}
onDetachTemplate={detachTemplate}
/>
)}

{/* ---------- STEP: QUALIFICATION ---------- */}
{draft.step === STEP.qualification && <Step2Qualification draft={draft} errors={errors} onEdit={setField} />}


{/* ---------- STEP: AWARD ---------- */}
{draft.step === STEP.award && (
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
['percentage', 'Percentage of stake'],
] as const).map(([value, label]) => (
<label key={value} className="np-radio-row" style={{ color: T.textPrimary }}>
<input
type="radio"
name="payoutMode"
checked={draft.payoutMode === value}
onChange={() => setField('payoutMode', value)}
/>
{label}
</label>
))}
</div>
{draft.payoutMode === 'percentage' ? (
<div style={{ maxWidth: 280 }}>
<Field
label="Percentage of stake"
error={errors.stakePercentage}
hint="Share of the qualifying cash stake returned as the award (1–100)."
>
<div className="np-input-wrap">
<input
type="number"
min="1"
max="100"
step="1"
className="np-input"
style={inputStyle(errors.stakePercentage)}
value={draft.stakePercentage}
placeholder="100"
aria-label="Percentage of stake returned"
onChange={(e) => setField('stakePercentage', e.target.value)}
/>
<span className="np-input-suffix" style={{ color: T.textSecondary }}>%</span>
</div>
</Field>
</div>
) : draft.payoutMode === 'fixed' ? (
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


{/* Caps: both reward types */}
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
<Field
label="Maximum value per award"
error={errors.maxValuePerAward}
hint="Cap on a single award. Leave blank for no cap."
>
{moneyInput(draft.maxValuePerAward, (v) => setField('maxValuePerAward', v), { placeholder: '0.00', ariaLabel: 'Maximum value per award in ZMW' })}
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
/>
{label}
{value === 'next-day' && (
<TimeField
value={draft.creditTime}
disabled={draft.creditTiming !== 'next-day'}
ariaLabel="Next-day credit time"
onChange={(v) => setField('creditTime', v)}
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

{/* ---------- STEP: BUDGET (BR-6) — hidden behind features.budgets (STEP.budget === 0 when off) ---------- */}
{features.budgets && draft.step === STEP.budget && (
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


{/* ---------- STEP: SCHEDULE ---------- */}
{draft.step === STEP.schedule && (
<>
<h2 className="np-card__heading" style={{ color: T.textPrimary }}>Schedule</h2>
<div className="np-form-grid">
<Field label="Start" required error={errors.startDate || errors.startTime} hint="Date and time (24h).">
<DateTimeField
showTime
value={parseIsoDateTime(draft.startDate, draft.startTime)}
invalid={!!(errors.startDate || errors.startTime)}
ariaLabel="Start date and time"
onChange={(d) => {
setField('startDate', d ? toIsoDate(d) : '');
setField('startTime', d ? toIsoTime(d) : '');
}}
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
/>
On date
{/* Never disabled: a disabled button swallows the click, so the picker would
 * not open and the radio would not flip either (native date inputs behaved the
 * same way). Applying a date selects "On date"; while Ongoing, show the placeholder. */}
<DateTimeField
showTime
block={false}
value={draft.endMode === 'date' ? parseIsoDateTime(draft.endDate, draft.endTime) : null}
invalid={!!(errors.endDate || errors.endTime)}
ariaLabel="End date and time"
onChange={(d) => {
setField('endDate', d ? toIsoDate(d) : '');
setField('endTime', d ? toIsoTime(d) : '');
if (d) setField('endMode', 'date');
}}
/>
</label>
<label className="np-radio-row" style={{ color: T.textPrimary }}>
<input
type="radio"
name="endMode"
checked={draft.endMode === 'ongoing'}
onChange={() => setField('endMode', 'ongoing')}
/>
Ongoing
</label>
</div>
{(errors.endDate || errors.endTime) && (
<p className="np-error" role="alert" style={{ color: T.destructive }}>{errors.endDate || errors.endTime}</p>
)}
</Field>
</div>
</>
)}


{/* ---------- STEP: CONTENT (CMS) ---------- */}
{/* Hidden behind features.content: STEP.content is 0 while the flag is off, so this never renders. */}
{draft.step === STEP.content && (
<>
<h2 className="np-card__heading" style={{ color: T.textPrimary }}>Content</h2>

{/* 1: TILE */}
<div className="np-section" style={{ borderTop: 'none', marginTop: 12, paddingTop: 0 }}>
<h3 className="np-section__title" style={{ color: T.textPrimary }}>Tile</h3>
<Field
label="Short description"
required
error={errors.shortDescription}
hint="One sentence shown on the promo tile. 'Read More' is added automatically, so do not include it."
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

{/* 2: BANNERS */}
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
aria-label={`Upload banner: ${slot.label}`}
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


{/* 3: TERMS & CONDITIONS */}
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

{/* 4: VISIBILITY PREVIEW */}
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
<p className="np-preview-tile__desc" style={{ color: T.textSecondary }}>{channelSummary(draft.channels)}</p>
<p className="np-preview-tile__more" style={{ color: T.navy }}>Read More</p>
</div>
</div>
</>
)}


{/* ---------- STEP: NOTIFICATIONS ---------- */}
{draft.step === STEP.notifications && (
<>
<h2 className="np-card__heading" style={{ color: T.textPrimary }}>Notifications</h2>
<p className="np-hint" style={{ color: T.textSecondary }}>
Optional player messages. Each is sent once when its event happens. The award message is on by default; turn on the qualify message if you need it.
Placeholders in double braces are filled in at send time.
</p>
{/* Award first, qualify second. Each rule's fields render only while its toggle (rule.enabled) is on. */}
              {(['onAward', 'onQualify'] as const).map((trigger, index) => {
const rule = draft.notifications[trigger];
const channelsError = errors[`notification:${trigger}:channels`];
const titleError = errors[`notification:${trigger}:title`];
const bodyError = errors[`notification:${trigger}:body`];
const bodyId = `np-notification-${trigger}-body`;
return (
<div key={trigger} className="np-section" style={index > 0 ? { borderTop: `1px solid ${T.border}` } : undefined}>
<div className="np-toggle-row" style={{ color: T.textPrimary }}>
<div>
<h3 className="np-section__title" style={{ color: T.textPrimary, margin: 0 }}>{NOTIFICATION_TRIGGER_LABELS[trigger]}</h3>
<p className="np-hint" style={{ color: T.textSecondary }}>
{trigger === 'onQualify'
? 'Sent as soon as the qualifying event is confirmed.'
: 'Sent when the reward is credited to the player.'}
</p>
</div>
<Toggle
checked={rule.enabled}
ariaLabel={`Send a message ${trigger === 'onQualify' ? 'when a player qualifies' : 'when a player is awarded'}`}
onChange={(checked) => setNotificationRule(trigger, { enabled: checked })}
/>
</div>
{rule.enabled && (
<div className="np-form-grid" style={{ marginTop: 12 }}>
<Field label="Delivery channels" required full error={channelsError}>
<div role="group" aria-label={`${NOTIFICATION_TRIGGER_LABELS[trigger]} delivery channels`} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
{NOTIFICATION_CHANNELS.map((channel) => {
const available = isNotificationChannelAvailable(channel);
return (
<Checkbox
key={channel}
checked={rule.channels.includes(channel)}
disabled={!available}
label={available ? NOTIFICATION_CHANNEL_LABELS[channel] : `${NOTIFICATION_CHANNEL_LABELS[channel]} (TBC)`}
onChange={(checked) => setNotificationRule(trigger, {
channels: checked
? NOTIFICATION_CHANNELS.filter((c) => c === channel || rule.channels.includes(c))
: rule.channels.filter((c) => c !== channel),
})}
/>
);
})}
</div>
</Field>
<Field label="Title" required full error={titleError}>
<input
type="text"
className="np-input"
style={inputStyle(titleError)}
value={rule.title}
maxLength={80}
placeholder="e.g. Your reward is on its way"
aria-label={`${NOTIFICATION_TRIGGER_LABELS[trigger]} title`}
onChange={(e) => setNotificationRule(trigger, { title: e.target.value })}
/>
</Field>
<Field label="Message" required full error={bodyError}>
<textarea
id={bodyId}
className="np-input np-textarea"
style={inputStyle(bodyError)}
value={rule.body}
placeholder="Hi {{firstName}}, ..."
aria-label={`${NOTIFICATION_TRIGGER_LABELS[trigger]} message`}
onChange={(e) => setNotificationRule(trigger, { body: e.target.value })}
/>
<div className="np-radio-group" style={{ marginTop: 8 }} aria-label="Insert placeholder">
{NOTIFICATION_PLACEHOLDERS.map((placeholder) => (
<GhostButton
key={placeholder}
small
onClick={() => setNotificationRule(trigger, { body: `${rule.body}${rule.body && !rule.body.endsWith(' ') ? ' ' : ''}${placeholderToken(placeholder)}` })}
>
<Plus size={12} /> {placeholderToken(placeholder)}
</GhostButton>
))}
</div>
<p className="np-hint" style={{ color: T.textSecondary, marginTop: 8 }}>
{rule.body.length} characters
{rule.channels.includes('sms') ? ` · SMS: ${smsSegments(rule.body.length)} segment(s) at ${SMS_SEGMENT_LENGTH} characters each` : ''}
</p>
</Field>
</div>
)}
</div>
);
})}
</>
)}

{/* ---------- STEP: REVIEW ---------- */}
{draft.step === STEP.review && (
<>
<h2 className="np-card__heading" style={{ color: T.textPrimary }}>Review</h2>
<div className="np-review-grid">
<ReviewSection
title="Basics"
step={STEP.basics}
onEdit={goToStep}
rows={[
['Name', draft.name.trim() || '·'],
['Type', typeLabel(draft)],
['Product vertical', draft.vertical || '·'],
]}
/>
<ReviewSection
title="Qualification"
step={STEP.qualification}
onEdit={goToStep}
rows={[
['Qualifying bet', `${qualificationRules.length} rule(s) across ${draft.qualification.triggers.length} trigger(s)`],
...(draft.qualification.triggers.length > 1
? [['Trigger logic', triggerChainSummary(draft.qualification.triggers, (trigger) => catalogEventLabel(trigger.eventId))] as [string, string]]
: []),
...draft.qualification.triggers.flatMap((trigger, index): [string, string][] => {
const visibleRules = trigger.rules.filter((rule) => !BET_RESTRICTIONS.some((restriction) => restriction.param === rule.param));
return [
[
`Trigger ${index + 1}${index > 0 ? ` (${TRIGGER_JOIN_LABELS[trigger.join ?? 'or']})` : ''}`,
`${catalogEventLabel(trigger.eventId)}: ${visibleRules.length > 0 ? visibleRules.map(qualificationRuleSummary).join(' AND ') : 'No conditions'}`,
],
];
}),
...qualificationRestrictionRows(draft.qualification.triggers),
[
'How often',
draft.qualification.counting.length > 0
? draft.qualification.counting.map(qualificationRuleSummary).join(' AND ')
: 'Each qualifying event (subject to award limits)',
],
['Channels', selectedChannelSummary],
['Combinable with other offers', draft.combinableWithOtherOffers ? 'Yes' : 'No'],

]}
/>

<ReviewSection
title="Award"
step={STEP.award}
onEdit={goToStep}
rows={[
['Reward type', draft.rewardType === 'freebet' ? 'Freebet' : 'Cash'],
...(draft.rewardType === 'freebet'
? ([
['Freebets', `${draft.freebetCount || '·'} × K ${draft.freebetValue || '·'}`],
['Expiry', `${draft.freebetExpiryHours || '·'} hours`],
] as [string, string][])
: ([
['Payout', draft.payoutMode === 'fixed' ? `Fixed: K ${draft.fixedAmount || '·'}` : draft.payoutMode === 'percentage' ? stakePercentageSummary(draft.stakePercentage, draft.maxValuePerAward) : `Tier matrix (${draft.tiers.length} rows)`],
...(draft.payoutMode === 'tiers' ? ([['Payout cap', draft.payoutCap ? `K ${draft.payoutCap}` : '·']] as [string, string][]) : []),
...(draft.payoutMode === 'percentage' ? ([['Maximum value per award', draft.maxValuePerAward.trim() ? formatAwardCap(draft.maxValuePerAward) : 'No cap']] as [string, string][]) : []),
] as [string, string][])),
[
'Caps',
`${draft.maxAwardsPerDay || '·'}/day · ${draft.lifetimeCount || '·'} lifetime · K ${draft.lifetimeValue || '·'} lifetime value`,
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
{/* Budget review row (BR-6): hidden behind features.budgets. */}
{features.budgets && (
<ReviewSection
title="Budget"
step={STEP.budget}
onEdit={goToStep}
rows={[
['Budget amount', draft.budget ? `K ${draft.budget}` : '·'],
['Alert threshold', `${draft.alertThreshold || '90'}%`],
['Alert recipients', draft.alertRecipients || '·'],
]}
/>
)}
<ReviewSection
title="Schedule"
step={STEP.schedule}
onEdit={goToStep}
rows={[
['Start', draft.startDate ? `${draft.startDate} ${draft.startTime || ''}`.trim() : '·'],
['End', draft.endMode === 'ongoing' ? 'Ongoing' : `${draft.endDate || '·'} ${draft.endTime || ''}`.trim()],
]}
/>
{/* Content review row: hidden behind features.content alongside the step. */}
{features.content && (
<ReviewSection
title="Content"
step={STEP.content}
onEdit={goToStep}
badge={
contentIncomplete ? (
<Badge color={T.yellow} textColor={T.textPrimary}>
<TriangleAlert size={12} style={{ marginRight: 4 }} />
Content incomplete: required before publish
</Badge>
) : undefined
}
rows={[
['Short description', draft.shortDescription || '·'],
['Banners', `${bannersFilled}/${draft.bannerSlots.length} slots filled`],
['T&Cs', draft.tcsFileName || 'Not uploaded'],
]}
/>
)}
<ReviewSection
title="Notifications"
step={STEP.notifications}
onEdit={goToStep}
rows={(['onAward', 'onQualify'] as const).map((trigger): [string, string] => {
const rule = draft.notifications[trigger];
return [
NOTIFICATION_TRIGGER_LABELS[trigger],
rule.enabled
? `${notificationChannelSummary(rule.channels)} · "${rule.title.trim() || '·'}" · ${rule.body.trim() || '·'}`
: 'Off',
];
})}
/>
</div>
</>
)}
</div>


{/* Footer: Back / Save draft / Save and exit on every step; Continue, or Save as template (TBC) + Submit on Review */}
<div className="np-wizard-footer">
<GhostButton onClick={() => (draft.step === STEP.basics ? requestExit() : goToStep(draft.step - 1))}>
<ChevronLeft size={16} /> Back
</GhostButton>
<div className="np-wizard-footer__group">
{draft.step === STEPS.length && (
/* Unreleased (TBC): shown on Review only, not wired up. */
<GhostButton disabled title="Coming soon" ariaLabel="Save as template (coming soon)">
<LayoutTemplate size={16} /> Save as template
</GhostButton>
)}
<GhostButton onClick={saveDraft}>
<Save size={16} /> Save draft
</GhostButton>
<GhostButton onClick={() => saveAndExit()}>
<LogOut size={16} /> Save and exit
</GhostButton>
{draft.step === STEPS.length ? (
<PrimaryButton onClick={() => setConfirmSubmit(true)}>
<CircleCheck size={16} /> Submit for approval
</PrimaryButton>
) : (
<PrimaryButton onClick={goContinue}>Continue</PrimaryButton>
)}
</div>
</div>
</div>
</div>

{/* Unsaved-changes guard: browser back, sidebar/list links, or Back on Step 1 while unsaved. */}
{leaveIntent && (
<div role="dialog" aria-modal="true" aria-labelledby="np-leave-title" data-testid="draft-leave-guard">
<div className="promo-modal__scrim" style={{ background: T.scrim }} onClick={() => setLeaveIntent(null)} />
<div className="promo-modal__card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}>
<h2 id="np-leave-title" className="promo-modal__title" style={{ color: T.textPrimary }}>
Save your changes before leaving?
</h2>
<p className="promo-modal__body" style={{ color: T.textSecondary }}>
{draft.reference
? `Changes since your last save of ${draft.reference} will be lost unless you save.`
: 'This promotion has not been saved yet. Save it as a draft to continue later from the promotions list.'}
</p>
<div className="promo-modal__actions">
<GhostButton onClick={() => setLeaveIntent(null)}>Keep editing</GhostButton>
<GhostButton onClick={leaveWithoutSaving}>Leave without saving</GhostButton>
<PrimaryButton onClick={() => saveAndExit(leaveIntent.kind === 'route' ? leaveIntent.href : '/admin/promotions')}>
<Save size={16} /> Save and exit
</PrimaryButton>
</div>
</div>
</div>
)}

{/* Submit confirm: confirm-before-commit (maker-checker). */}
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

{/* Discard confirm (destructive-adjacent): clears the persisted draft. */}
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

