'use client';

/**
 * Step 1: Basics.
 * Creating from scratch is the default: the Details section (name,
 * promotion type, vertical) renders first with the type select unlocked.
 * Templates are opt-in: the "Use template" button toggles an inline panel
 * of template cards (full prefill, confirm-before-commit over dirty edits).
 * An applied template locks the type ("Set by template") and shows a
 * detachable chip next to the heading; detaching keeps all field values.
 * All template/type metadata comes from src/data/promotion-templates.ts.
 */
import { useState } from 'react';
import { Plane, RotateCcw, X } from 'lucide-react';
import T from '@/theme/tokens';
import { Badge, GhostButton, PrimaryButton } from '@/components/ui';
import {
PRODUCT_VERTICALS,
PROMOTION_TEMPLATES,
PROMOTION_TYPES,
getPromotionType,
getTemplate,
isTypeSelectable,
} from '@/data/promotion-templates';
import type { ProductVertical, PromotionTypeId, TemplateId } from '@/data/promotion-templates';
import type { PromotionDraft } from './draft';
import { Field, inputStyle } from './fields';

const TEMPLATE_ICONS: Record<TemplateId, typeof Plane> = {
welcome_offer: Plane,
cashback: RotateCcw,
};

interface Step1BasicsProps {
draft: PromotionDraft;
errors: Record<string, string>;
/** Field edit, marks the draft dirty and clears that field's error. */
onEdit: <K extends keyof PromotionDraft>(key: K, value: PromotionDraft[K]) => void;
/** Writes the template's full prefill into the draft. */
onApplyTemplate: (id: TemplateId) => void;
/** Detaches the template, unlocks the type and keeps every field value. */
onDetachTemplate: () => void;
}

export function Step1Basics({ draft, errors, onEdit, onApplyTemplate, onDetachTemplate }: Step1BasicsProps) {
const [panelOpen, setPanelOpen] = useState(false);
const [pendingTemplate, setPendingTemplate] = useState<TemplateId | null>(null);

const typeMeta = getPromotionType(draft.type);
/* An attached template owns the type; scratch (no template) leaves it editable. */
const typeLocked = draft.template !== null;

const applyTemplate = (id: TemplateId) => {
onApplyTemplate(id);
setPanelOpen(false);
};

const selectTemplate = (id: TemplateId) => {
if (id === draft.template) {
setPanelOpen(false);
return;
}
/* Confirm-before-commit: applying over dirty edits replaces the configuration. */
if (draft.dirty) {
setPendingTemplate(id);
return;
}
applyTemplate(id);
};

const confirmApply = () => {
if (pendingTemplate) applyTemplate(pendingTemplate);
setPendingTemplate(null);
};

return (
<>
{/* Heading row: Basics + applied-template chip + Use template toggle */}
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
<h2 className="np-card__heading" style={{ color: T.textPrimary }}>Basics</h2>
{draft.template && (
<Badge ghost color={T.navy}>
Template: {getTemplate(draft.template).name}
<button
type="button"
aria-label="Detach template"
onClick={onDetachTemplate}
style={{
display: 'inline-flex',
alignItems: 'center',
marginLeft: 4,
padding: 0,
border: 'none',
background: 'none',
color: 'inherit',
cursor: 'pointer',
font: 'inherit',
}}
>
<X size={12} />
</button>
</Badge>
)}
</div>
<GhostButton small onClick={() => setPanelOpen((open) => !open)} ariaLabel="Use template">
Use template
</GhostButton>
</div>

{/* Template panel: opt-in; a card applies the template's full prefill */}
{panelOpen && (
<div
style={{
marginTop: 12,
padding: 16,
border: `1px solid ${T.border}`,
borderRadius: T.radiusMd,
}}
>
<div className="np-template-grid" style={{ marginTop: 0 }}>
{PROMOTION_TEMPLATES.map((tpl) => {
const Icon = TEMPLATE_ICONS[tpl.id];
const selected = draft.template === tpl.id;
return (
<button
key={tpl.id}
type="button"
className="np-template-card"
aria-pressed={selected}
style={{
background: selected ? T.selectionBg : T.white,
border: selected ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
borderRadius: T.radiusMd,
}}
onClick={() => selectTemplate(tpl.id)}
onMouseEnter={(e) => { e.currentTarget.style.boxShadow = T.shadowRaise; }}
onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
>
<Icon size={20} style={{ color: T.navy }} />
<span className="np-template-card__title" style={{ color: T.textPrimary }}>{tpl.name}</span>
<span className="np-template-card__caption" style={{ color: T.textSecondary }}>{tpl.caption}</span>
</button>
);
})}
</div>
</div>
)}

{/* Details: name, type (locked while a template is attached), vertical */}
<div className="np-form-grid">
<Field label="Name" required error={errors.name} full>
<input
/* Stable id: the wizard focuses this field when Save draft is used without a name. */
id="np-field-name"
className="np-input"
style={inputStyle(errors.name)}
value={draft.name}
placeholder="e.g. Aviator Welcome Offer"
aria-label="Promotion name"
onChange={(e) => onEdit('name', e.target.value)}
/>
</Field>
<Field
label="Promotion type"
required
error={errors.type}
hint={typeLocked ? 'Set by template' : undefined}
>
<select
className="np-input"
style={inputStyle(errors.type)}
value={draft.type}
disabled={typeLocked}
aria-label="Promotion type"
onChange={(e) => onEdit('type', e.target.value as PromotionTypeId | '')}
>
<option value="">Select a type</option>
{PROMOTION_TYPES.map((t) => (
<option key={t.id} value={t.id} disabled={!isTypeSelectable(t.id)}>
{isTypeSelectable(t.id) ? t.label : `${t.label} (TBC)`}
</option>
))}
</select>
{typeMeta && (
<p className="np-hint" style={{ color: T.textSecondary, fontSize: 14 }}>{typeMeta.summary}</p>
)}
</Field>
<Field label="Product vertical" required error={errors.vertical}>
<select
className="np-input"
style={inputStyle(errors.vertical)}
value={draft.vertical}
aria-label="Product vertical"
onChange={(e) => onEdit('vertical', e.target.value as ProductVertical | '')}
>
<option value="">Select a vertical</option>
{PRODUCT_VERTICALS.map((v) => (
<option key={v} value={v}>{v}</option>
))}
</select>
</Field>
</div>

{/* Confirm-before-commit: applying a template replaces the configuration */}
{pendingTemplate && (
<div role="dialog" aria-modal="true" aria-labelledby="np-apply-template-title">
<div
className="promo-modal__scrim"
style={{ background: T.scrim }}
onClick={() => setPendingTemplate(null)}
/>
<div
className="promo-modal__card"
style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}
>
<h2 id="np-apply-template-title" className="promo-modal__title" style={{ color: T.textPrimary }}>
Apply template?
</h2>
<p className="promo-modal__body" style={{ color: T.textSecondary }}>
Applying a template will replace your current configuration.
</p>
<div className="promo-modal__actions">
<GhostButton onClick={() => setPendingTemplate(null)}>Cancel</GhostButton>
<PrimaryButton onClick={confirmApply}>Apply template</PrimaryButton>
</div>
</div>
</div>
)}
</>
);
}

export default Step1Basics;

