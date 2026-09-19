'use client';

/**
 * Step 2: Qualification (rules-only model).
 * Trigger rules are the single source of truth for conditions and restrictions.
 * Counting and eligibility remain separate groups within draft.qualification.
 */
import { useState } from 'react';
import { Info, Plus, Trash2, TriangleAlert, X } from 'lucide-react';
import T from '@/theme/tokens';
import { Checkbox, DestructiveGhostButton, FilterSelect, GhostButton } from '@/components/ui';
import { BET_TIMINGS, BET_TIMING_LABELS, CHANNELS, CHANNEL_LABELS, allChannels } from '@/lib/promotions';
import type { BetTiming, Channel } from '@/lib/promotions';
import {
 BET_RESTRICTIONS,
 BOOLEAN_OPTIONS,
 EVENT_CATALOG,
 PLAYER_PARAMS,
 catalogEventLabel,
 getCatalogEvent,
 isNumericType,
} from '@/data/event-catalog';
import type { EventId, EventParam } from '@/data/event-catalog';
import { AGGREGATION_PARAMS } from '@/data/aggregation-catalog';
import {
 QUALIFICATION_OPERATOR_VALUES,
 defaultOperator,
 isListOperator,
 isRangeOperator,
 isZeroArityOperator,
 operatorsForType,
} from '@/data/operator-catalog';
import type { PromotionDraft, Qualification, Trigger, TriggerRule } from './draft';
import { inputStyle } from './fields';

interface Step2QualificationProps {
 draft: PromotionDraft;
 errors: Record<string, string>;
 /** Field edit, marks the draft dirty and clears that field's error. */
 onEdit: <K extends keyof PromotionDraft>(key: K, value: PromotionDraft[K]) => void;
}

const REGISTRATION_EVENT: EventId = 'registration';
const SETTLEMENT_PARAMS = ['Losing Legs', 'Remaining Odds'];

const BET_TIMING_OPTIONS = BET_TIMINGS.map((timing) => BET_TIMING_LABELS[timing]);

function betTimingFromLabel(label: string): BetTiming {
  return BET_TIMINGS.find((timing) => BET_TIMING_LABELS[timing] === label) ?? 'both';
}

function newId(prefix: string): string {
 return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function ruleFromParam(param: EventParam): TriggerRule {
 return {
 id: newId('rule'),
 param: param.name,
 type: param.type,
 operator: defaultOperator(param.type),
 value: '',
 };
}

/** Drop values that cannot be represented by the next operator's control. */
function withOperator(rule: TriggerRule, operator: string): TriggerRule {
 const next: TriggerRule = { ...rule, operator };

 if (isZeroArityOperator(operator)) {
 next.value = '';
 delete next.value2;
 } else if (!isRangeOperator(operator)) {
 delete next.value2;
 if (
 isListOperator(rule.operator)
 && !isListOperator(operator)
 && (rule.type === 'enum' || rule.type === 'boolean')
 && rule.value.includes(',')
 ) {
 next.value = '';
 }
 }

 return next;
}

function paramFor(rule: TriggerRule, params: EventParam[]): EventParam | undefined {
 return params.find((param) => param.name === rule.param);
}

function isRestrictionParam(name: string): boolean {
 return BET_RESTRICTIONS.some((restriction) => restriction.param === name);
}

/** Checked means the canonical exclusion rule exists, not separate UI state. */
function hasRestriction(trigger: Trigger, param: string): boolean {
 return trigger.rules.some((rule) =>
 rule.param === param
 && rule.operator === QUALIFICATION_OPERATOR_VALUES.equals
 && rule.value === 'No',
 );
}

/** Betting params use BET / RESULT; other events retain their event heading. */
function pickerGroupsFor(eventId: string): { label: string; params: EventParam[] }[] {
 const event = getCatalogEvent(eventId);
 const params = (event?.params ?? []).filter((param) => !isRestrictionParam(param.name));
 const eventGroups = params.some((param) => param.group)
 ? [
 { label: 'BET', params: params.filter((param) => param.group === 'bet') },
 { label: 'RESULT', params: params.filter((param) => param.group === 'result') },
 ]
 : [{ label: catalogEventLabel(eventId).toUpperCase(), params }];

 return [...eventGroups, { label: 'PLAYER', params: PLAYER_PARAMS }];
}

export function Step2Qualification({ draft, errors, onEdit }: Step2QualificationProps) {
 const [eventModalOpen, setEventModalOpen] = useState(false);
 const [paramPickerFor, setParamPickerFor] = useState<string | null>(null);
 const [confirmDeleteTrigger, setConfirmDeleteTrigger] = useState<Trigger | null>(null);
 const [pendingSwitch, setPendingSwitch] = useState<{
 triggerId: string;
 eventId: EventId;
 } | null>(null);

 const qualification = draft.qualification;
 const eligibility = qualification.eligibility;
 const errorFor = (key: string): string | undefined => errors[key];

 const anyRegistrationTrigger = qualification.triggers.some(
 (trigger) => trigger.eventId === REGISTRATION_EVENT,
 );
 const anySettlementRule = qualification.triggers.some((trigger) =>
 trigger.rules.some((rule) => SETTLEMENT_PARAMS.includes(rule.param)),
 );

 const commit = (next: Qualification) => onEdit('qualification', next);

 const mapTrigger = (
 triggerId: string,
 fn: (trigger: Trigger) => Trigger,
 ): Qualification => ({
 ...qualification,
 triggers: qualification.triggers.map(
 (trigger) => trigger.id === triggerId ? fn(trigger) : trigger,
 ),
 });

 /* Group 1: Qualifying bet */
 const addTrigger = (eventId: EventId) => {
 commit({
 ...qualification,
 triggers: [
 ...qualification.triggers,
 { id: newId('trigger'), eventId, rules: [] },
 ],
 });
 setEventModalOpen(false);
 };

 const applyEventSwitch = (triggerId: string, eventId: EventId) => {
 commit(mapTrigger(triggerId, (trigger) => ({
 ...trigger,
 eventId,
 rules: [],
 })));
 setPendingSwitch(null);
 setParamPickerFor(null);
 };

 const requestEventSwitch = (trigger: Trigger, eventId: EventId) => {
 if (eventId === trigger.eventId) return;
 if (trigger.rules.length > 0) {
 setPendingSwitch({ triggerId: trigger.id, eventId });
 return;
 }
 applyEventSwitch(trigger.id, eventId);
 };

 const requestDeleteTrigger = (trigger: Trigger) => {
 if (trigger.rules.length > 0) {
 setConfirmDeleteTrigger(trigger);
 return;
 }
 commit({
 ...qualification,
 triggers: qualification.triggers.filter((item) => item.id !== trigger.id),
 });
 if (paramPickerFor === trigger.id) setParamPickerFor(null);
 if (pendingSwitch?.triggerId === trigger.id) setPendingSwitch(null);
 };

 const deleteTrigger = () => {
 if (confirmDeleteTrigger) {
 commit({
 ...qualification,
 triggers: qualification.triggers.filter(
 (trigger) => trigger.id !== confirmDeleteTrigger.id,
 ),
 });
 if (paramPickerFor === confirmDeleteTrigger.id) setParamPickerFor(null);
 if (pendingSwitch?.triggerId === confirmDeleteTrigger.id) setPendingSwitch(null);
 }
 setConfirmDeleteTrigger(null);
 };

 const addTriggerRule = (triggerId: string, param: EventParam) => {
 commit(mapTrigger(triggerId, (trigger) => ({
 ...trigger,
 rules: [...trigger.rules, ruleFromParam(param)],
 })));
 setParamPickerFor(null);
 };

 const updateTriggerRule = (triggerId: string, next: TriggerRule) => {
 commit(mapTrigger(triggerId, (trigger) => ({
 ...trigger,
 rules: trigger.rules.map((rule) => rule.id === next.id ? next : rule),
 })));
 };

 const removeTriggerRule = (triggerId: string, ruleId: string) => {
 commit(mapTrigger(triggerId, (trigger) => ({
 ...trigger,
 rules: trigger.rules.filter((rule) => rule.id !== ruleId),
 })));
 };

 const setRestriction = (triggerId: string, param: string, checked: boolean) => {
 commit(mapTrigger(triggerId, (trigger) => {
 const rules = trigger.rules.filter((rule) => rule.param !== param);
 return {
 ...trigger,
 rules: checked
 ? [
 ...rules,
 {
 id: newId('rule'),
 param,
 type: 'boolean',
 operator: QUALIFICATION_OPERATOR_VALUES.equals,
 value: 'No',
 },
 ]
 : rules,
 };
 }));
 };

 /* Group 2: How often */
 const addCountingRule = (param: EventParam) => {
 commit({
 ...qualification,
 counting: [...qualification.counting, ruleFromParam(param)],
 });
 setParamPickerFor(null);
 };

 const updateCountingRule = (next: TriggerRule) => {
 commit({
 ...qualification,
 counting: qualification.counting.map(
 (rule) => rule.id === next.id ? next : rule,
 ),
 });
 };

 const removeCountingRule = (ruleId: string) => {
 commit({
 ...qualification,
 counting: qualification.counting.filter((rule) => rule.id !== ruleId),
 });
 };

 /* Bet timing: prematch, live or both. */
 const setBetTiming = (betTiming: BetTiming) => {
 commit({ ...qualification, betTiming });
 };

 /* Channels: parent "All channels" plus one checkbox per surface, in canonical order. */
 const allChannelsSelected = CHANNELS.every((channel) => draft.channels.includes(channel));
 const someChannelsSelected = !allChannelsSelected && draft.channels.length > 0;

 const setChannel = (channel: Channel, checked: boolean) => {
 onEdit(
 'channels',
 CHANNELS.filter((item) => item === channel ? checked : draft.channels.includes(item)),
 );
 };

 const setAllChannels = (checked: boolean) => {
 onEdit('channels', checked ? allChannels() : []);
 };

 /* Group 3: Who's eligible */
 const setAudience = (audience: Qualification['eligibility']['audience']) => {
 commit({
 ...qualification,
 eligibility: audience === 'all' ? { audience } : { ...eligibility, audience },
 });
 };

 const setWindowDays = (raw: string) => {
 const n = Number(raw);
 commit({
 ...qualification,
 eligibility: {
 ...eligibility,
 windowDays: raw.trim() === '' || Number.isNaN(n) ? undefined : n,
 },
 });
 };

 const setNonConsecutive = (value: boolean) => {
 commit({
 ...qualification,
 eligibility: { ...eligibility, nonConsecutive: value },
 });
 };

 const renderValue = (
 rule: TriggerRule,
 param: EventParam | undefined,
 error: string | undefined,
 onChange: (next: TriggerRule) => void,
 ) => {
 if (isZeroArityOperator(rule.operator)) {
 return (
 <span className="np-rule-novalue" style={{ color: T.textSecondary }}>
 · no value ·
 </span>
 );
 }

 const numeric = isNumericType(rule.type);

 if (isRangeOperator(rule.operator)) {
 return (
 <>
 <input
 type={numeric ? 'number' : 'text'}
 step={rule.type === 'float' ? 'any' : undefined}
 className="np-input np-rule-value"
 style={inputStyle(error)}
 value={rule.value}
 placeholder="Min"
 aria-label={`${rule.param} minimum`}
 onChange={(e) => onChange({ ...rule, value: e.target.value })}
 />
 <input
 type={numeric ? 'number' : 'text'}
 step={rule.type === 'float' ? 'any' : undefined}
 className="np-input np-rule-value"
 style={inputStyle(error)}
 value={rule.value2 ?? ''}
 placeholder="Max"
 aria-label={`${rule.param} maximum`}
 onChange={(e) => onChange({ ...rule, value2: e.target.value })}
 />
 </>
 );
 }

 if (isListOperator(rule.operator)) {
 const options = rule.type === 'boolean'
 ? BOOLEAN_OPTIONS
 : rule.type === 'enum' ? param?.options : undefined;

 if (options) {
 const selected = rule.value.split(',').map((value) => value.trim()).filter(Boolean);
 return (
 <div
 role="group"
 aria-label={`${rule.param} values`}
 aria-invalid={Boolean(error)}
 style={{
 ...inputStyle(error),
 display: 'flex',
 flexWrap: 'wrap',
 gap: 12,
 padding: 8,
 }}
 >
 {options.map((option) => (
 <Checkbox
 key={option}
 checked={selected.includes(option)}
 label={option}
 onChange={(checked) => {
 const remaining = selected.filter(
 (value) => value !== option && options.includes(value),
 );
 onChange({
 ...rule,
 value: (checked ? [...remaining, option] : remaining).join(','),
 });
 }}
 />
 ))}
 </div>
 );
 }

 return (
 <input
 type="text"
 className="np-input np-rule-value"
 style={inputStyle(error)}
 value={rule.value}
 placeholder="Comma-separated"
 aria-label={`${rule.param} values`}
 onChange={(e) => onChange({ ...rule, value: e.target.value })}
 />
 );
 }

 if (rule.type === 'boolean') {
 return (
 <select
 className="np-input np-rule-value"
 style={inputStyle(error)}
 value={rule.value}
 aria-label={`${rule.param} value`}
 onChange={(e) => onChange({ ...rule, value: e.target.value })}
 >
 <option value="">Select...</option>
 {BOOLEAN_OPTIONS.map((option) => (
 <option key={option} value={option}>{option}</option>
 ))}
 </select>
 );
 }

 if (rule.type === 'enum' && param?.options) {
 return (
 <select
 className="np-input np-rule-value"
 style={inputStyle(error)}
 value={rule.value}
 aria-label={`${rule.param} value`}
 onChange={(e) => onChange({ ...rule, value: e.target.value })}
 >
 <option value="">Select...</option>
 {param.options.map((option) => (
 <option key={option} value={option}>{option}</option>
 ))}
 </select>
 );
 }

 return (
 <input
 type={numeric ? 'number' : 'text'}
 step={rule.type === 'float' ? 'any' : undefined}
 className="np-input np-rule-value"
 style={inputStyle(error)}
 value={rule.value}
 placeholder="Value"
 aria-label={`${rule.param} value`}
 onChange={(e) => onChange({ ...rule, value: e.target.value })}
 />
 );
 };

 const renderRuleRow = (
 rule: TriggerRule,
 params: EventParam[],
 errorKey: string,
 onChange: (next: TriggerRule) => void,
 onRemove: () => void,
 prefix?: string,
 ) => {
 const error = errorFor(errorKey);
 const param = paramFor(rule, params);

 return (
 <div key={rule.id}>
 <div className="np-rule-row">
 {prefix && (
 <span className="np-rule-prefix" style={{ color: T.textSecondary }}>
 {prefix}
 </span>
 )}
 <span className="np-rule-param" style={{ color: T.textPrimary }}>
 {rule.param}
 </span>
 <select
 className="np-input np-rule-operator"
 style={inputStyle()}
 value={rule.operator}
 aria-label={`Operator for ${rule.param}`}
 onChange={(e) => onChange(withOperator(rule, e.target.value))}
 >
 {operatorsForType(rule.type).map((operator) => (
 <option key={operator.value} value={operator.value}>
 {operator.label}
 </option>
 ))}
 </select>
 {renderValue(rule, param, error, onChange)}
 <button
 type="button"
 className="np-icon-btn"
 style={{ color: T.textSecondary }}
 aria-label={`Remove ${rule.param} condition`}
 onClick={onRemove}
 >
 <X size={14} />
 </button>
 </div>
 {rule.param === 'Cash-out multiplier' && (
 <p className="np-hint" style={{ color: T.textSecondary, marginTop: 4 }}>
 applies only to cashed-out bets
 </p>
 )}
 {error && (
 <p className="np-error" role="alert" style={{ color: T.destructive }}>
 {error}
 </p>
 )}
 </div>
 );
 };

 const renderParamPicker = (
 groups: { label: string; params: EventParam[] }[],
 onPick: (param: EventParam) => void,
 ) => (
 <div
 className="np-param-panel"
 style={{
 border: `1px solid ${T.border}`,
 borderRadius: T.radiusSm,
 background: T.white,
 }}
 >
 {groups.map((group) => (
 <div key={group.label}>
 <p className="np-event-cat" style={{ color: T.textSecondary }}>
 {group.label}
 </p>
 {group.params.length > 0 ? (
 <div className="np-param-options">
 {group.params.map((param) => (
 <button
 key={param.name}
 type="button"
 className="np-param-option"
 style={{
 border: `1px solid ${T.border}`,
 borderRadius: T.radiusSm,
 color: T.textPrimary,
 background: T.white,
 padding: '8px 12px',
 }}
 onClick={() => onPick(param)}
 >
 {param.name}
 </button>
 ))}
 </div>
 ) : (
 <p className="np-hint" style={{ color: T.textSecondary }}>
 No parameters available.
 </p>
 )}
 </div>
 ))}
 </div>
 );

 return (
 <>
 <h2 className="np-card__heading" style={{ color: T.textPrimary }}>
 Qualification
 </h2>

 <section aria-labelledby="np-channels-title" style={{ marginTop: 20 }}>
<h3
id="np-channels-title"
className="np-section__title"
style={{ color: T.textPrimary }}
>
Channels
</h3>
<p className="np-hint" style={{ color: T.textSecondary }}>
Where players can qualify for this promotion. At least one channel is required.
</p>
<div
role="group"
aria-label="Channels"
aria-describedby={errors.channels ? 'np-channels-error' : undefined}
style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}
>
<Checkbox
checked={allChannelsSelected}
indeterminate={someChannelsSelected}
label="All channels"
onChange={(checked) => setAllChannels(checked)}
/>
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingLeft: 24 }}>
{CHANNELS.map((channel) => (
<Checkbox
key={channel}
checked={draft.channels.includes(channel)}
label={CHANNEL_LABELS[channel]}
onChange={(checked) => setChannel(channel, checked)}
/>
))}
</div>
</div>
{errors.channels && (
<p
id="np-channels-error"
className="np-error"
role="alert"
style={{ color: T.destructive, marginTop: 8 }}
>
{errors.channels}
</p>
)}
</section>

<section
className="np-section"
aria-labelledby="np-qualifying-title"
style={{ borderTop: `1px solid ${T.border}` }}
>
 <h3
 id="np-qualifying-title"
 className="np-section__title"
 style={{ color: T.textPrimary }}
 >
 Qualifying bet
 </h3>

 {errorFor('triggers') && (
 <p className="np-error" role="alert" style={{ color: T.destructive }}>
 {errorFor('triggers')}
 </p>
 )}

 {qualification.triggers.map((trigger, index) => {
 const event = getCatalogEvent(trigger.eventId);
 const groups = pickerGroupsFor(trigger.eventId);
 const params = [...(event?.params ?? []), ...PLAYER_PARAMS];
 const visibleRules = trigger.rules.filter((rule) => !isRestrictionParam(rule.param));
 const switching = pendingSwitch?.triggerId === trigger.id ? pendingSwitch : null;
 const error = errorFor(`trigger:${trigger.id}`);

 return (
 <div key={trigger.id}>
 {index > 0 && (
 <div className="np-or-divider" style={{ color: T.textSecondary }}>
 <span className="np-or-divider__line" style={{ background: T.border }} />
 OR
 <span className="np-or-divider__line" style={{ background: T.border }} />
 </div>
 )}

 <div
 className="np-trigger-card"
 style={{
 background: T.offWhite,
 border: `1px solid ${error ? T.destructive : T.border}`,
 borderRadius: T.radiusSm,
 marginTop: index === 0 ? 12 : 0,
 }}
 >
 <div className="np-trigger-card__head" style={{ flexWrap: 'wrap' }}>
 <label className="np-rule-row" style={{ color: T.textPrimary }}>
 <span className="np-trigger-card__title">WHEN</span>
 <select
 className="np-input"
 style={inputStyle(error)}
 value={trigger.eventId}
 aria-label={`Trigger ${index + 1} event`}
 aria-invalid={Boolean(error)}
 aria-describedby={`np-event-description-${trigger.id}`}
 onChange={(e) => requestEventSwitch(trigger, e.target.value as EventId)}
 >
 {EVENT_CATALOG.map((category) => (
 <optgroup key={category.label} label={category.label}>
 {category.events.map((option) => (
 <option
 key={option.id}
 value={option.id}
 title={option.description}
 >
 {option.label}
 </option>
 ))}
 </optgroup>
 ))}
 </select>
 {draft.vertical && (
 <span className="np-trigger-card__title">· {draft.vertical}</span>
 )}
 </label>
 <GhostButton
 small
 ariaLabel={`Delete ${catalogEventLabel(trigger.eventId)} trigger`}
 onClick={() => requestDeleteTrigger(trigger)}
 >
 <Trash2 size={16} />
 </GhostButton>
 </div>

 <p
 id={`np-event-description-${trigger.id}`}
 className="np-hint"
 style={{ color: T.textSecondary, marginTop: 8 }}
 >
 {event?.description}
 </p>

 {error && (
 <p
 className="np-error"
 role="alert"
 style={{ color: T.destructive, marginTop: 8 }}
 >
 {error}
 </p>
 )}

 {switching && (
 <div
 className="np-notice"
 role="alertdialog"
 aria-labelledby={`np-switch-${trigger.id}`}
 style={{ background: T.offWhite, borderRadius: T.radiusSm, marginTop: 12 }}
 >
 <TriangleAlert size={16} style={{ color: T.destructive }} />
 <div style={{ flex: 1 }}>
 <p
 id={`np-switch-${trigger.id}`}
 className="np-hint"
 style={{ color: T.textPrimary, fontWeight: 500 }}
 >
 Switch to &quot;{catalogEventLabel(switching.eventId)}&quot;?
 </p>
 <p className="np-hint" style={{ color: T.textSecondary }}>
 All {trigger.rules.length} conditions on this card will be removed.
 Other triggers are unchanged.
 </p>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
 <GhostButton small onClick={() => setPendingSwitch(null)}>
 Keep current event
 </GhostButton>
 <DestructiveGhostButton
 small
 onClick={() => applyEventSwitch(trigger.id, switching.eventId)}
 >
 Switch and remove
 </DestructiveGhostButton>
 </div>
 </div>
 </div>
 )}

 <div className="np-rule-list">
 {visibleRules.map((rule) => renderRuleRow(
 rule,
 params,
 `rule:${rule.id}`,
 (next) => updateTriggerRule(trigger.id, next),
 () => removeTriggerRule(trigger.id, rule.id),
 'AND',
 ))}
 </div>

 <div style={{ marginTop: 12 }}>
 <GhostButton
 small
 onClick={() => setParamPickerFor(
 (open) => open === trigger.id ? null : trigger.id,
 )}
 >
 <Plus size={14} /> Add condition
 </GhostButton>
 </div>
 {paramPickerFor === trigger.id && renderParamPicker(
 groups,
 (param) => addTriggerRule(trigger.id, param),
 )}

 <section
 aria-labelledby={`np-restrictions-${trigger.id}`}
 style={{
 borderTop: `1px solid ${T.border}`,
 marginTop: 16,
 paddingTop: 12,
 }}
 >
 <h4
 id={`np-restrictions-${trigger.id}`}
 style={{ color: T.textPrimary, fontSize: 14, fontWeight: 500, margin: 0 }}
 >
 Restrictions: bets that never qualify
 </h4>
 <div
 style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}
 >
 {BET_RESTRICTIONS.map((restriction) => (
 <Checkbox
 key={restriction.param}
 checked={hasRestriction(trigger, restriction.param)}
 label={restriction.label}
 onChange={(checked) => setRestriction(
 trigger.id,
 restriction.param,
 checked,
 )}
 />
 ))}
 </div>
 </section>
 </div>
 </div>
 );
 })}

 <div style={{ marginTop: 12 }}>
 <GhostButton small onClick={() => setEventModalOpen(true)}>
 <Plus size={14} /> Add trigger event
 </GhostButton>
 </div>

 {anySettlementRule && (
 <div
 className="np-notice"
 style={{ background: T.offWhite, borderRadius: T.radiusSm, marginTop: 8 }}
 >
 <Info size={16} style={{ color: T.textSecondary }} />
 <span style={{ color: T.textPrimary }}>
 Settled means all selections are resulted; bets with pending legs wait.
 Cancelled/postponed legs count as odds 1.00, which is the platform standard.
 </span>
 </div>
 )}

 <div
 className="np-field"
 style={{ marginTop: 16, maxWidth: 320 }}
 >
 <span id="np-bet-timing-label" className="np-label" style={{ color: T.textPrimary }}>
 Bet timing
 </span>
 <div role="group" aria-labelledby="np-bet-timing-label" aria-describedby="np-bet-timing-hint">
 <FilterSelect
 label={BET_TIMING_LABELS[qualification.betTiming]}
 options={BET_TIMING_OPTIONS}
 onChange={(label) => setBetTiming(betTimingFromLabel(label))}
 />
 </div>
 <p id="np-bet-timing-hint" className="np-hint" style={{ color: T.textSecondary }}>
 Live bets are placed after the event has started.
 </p>
 </div>
 </section>

 <section
 className="np-section"
 aria-labelledby="np-counting-title"
 style={{ borderTop: `1px solid ${T.border}` }}
 >
 <h3
 id="np-counting-title"
 className="np-section__title"
 style={{ color: T.textPrimary }}
 >
 How often
 </h3>
 <p className="np-hint" style={{ color: T.textSecondary }}>
 All counting conditions must hold. Per-day conditions award once per qualifying day;
 total conditions award once when the threshold is reached.
 </p>
 {qualification.counting.length === 0 && (
 <p className="np-hint" style={{ color: T.textSecondary, marginTop: 8 }}>
 No counting conditions. Each qualifying event can award, subject to award limits.
 </p>
 )}
 <div className="np-rule-list">
 {qualification.counting.map((rule) => renderRuleRow(
 rule,
 AGGREGATION_PARAMS,
 `counting:${rule.id}`,
 updateCountingRule,
 () => removeCountingRule(rule.id),
 'AND',
 ))}
 </div>
 <div style={{ marginTop: 12 }}>
 <GhostButton
 small
 onClick={() => setParamPickerFor(
 (open) => open === 'counting' ? null : 'counting',
 )}
 >
 <Plus size={14} /> Add counting condition
 </GhostButton>
 </div>
 {paramPickerFor === 'counting' && renderParamPicker(
 [{ label: 'COUNTING', params: AGGREGATION_PARAMS }],
 addCountingRule,
 )}
 <p className="np-hint" style={{ color: T.textSecondary, marginTop: 12 }}>
 Attribution: placement day, Africa/Lusaka.
 </p>
 </section>

 <section
 className="np-section"
 aria-labelledby="np-eligibility-title"
 style={{ borderTop: `1px solid ${T.border}` }}
 >
 <h3
 id="np-eligibility-title"
 className="np-section__title"
 style={{ color: T.textPrimary }}
 >
 Who&apos;s eligible
 </h3>
 <div
 className="np-radio-group"
 role="radiogroup"
 aria-label="Eligibility"
 style={{ marginTop: 12 }}
 >
 <label className="np-radio-row" style={{ color: T.textPrimary }}>
 <input
 type="radio"
 name="eligibility"
 checked={eligibility.audience === 'all'}
 onChange={() => setAudience('all')}
 />
 All players
 </label>
 <label className="np-radio-row" style={{ color: T.textPrimary }}>
 <input
 type="radio"
 name="eligibility"
 checked={eligibility.audience === 'new_customers'}
 onChange={() => setAudience('new_customers')}
 />
 New customers
 </label>
 </div>

 {eligibility.audience === 'new_customers' && (
 <div style={{ marginTop: 12 }}>
 <label className="np-radio-row" style={{ color: T.textPrimary, flexWrap: 'wrap' }}>
 Within
 <input
 type="number"
 min="1"
 step="1"
 className="np-input"
 style={{ ...inputStyle(errors.eligibilityDays), width: 80 }}
 value={eligibility.windowDays ?? ''}
 aria-label="Days since registration"
 aria-invalid={Boolean(errors.eligibilityDays)}
 aria-describedby={errors.eligibilityDays ? 'np-eligibility-error' : undefined}
 onChange={(e) => setWindowDays(e.target.value)}
 />
 days of registration
 </label>
 {errors.eligibilityDays && (
 <p
 id="np-eligibility-error"
 className="np-error"
 role="alert"
 style={{ color: T.destructive }}
 >
 {errors.eligibilityDays}
 </p>
 )}
 <div style={{ marginTop: 12 }}>
 <Checkbox
 checked={Boolean(eligibility.nonConsecutive)}
 label="Missing a day doesn't disqualify the player"
 description="The player can qualify on any of the days in the window; they don't have to be back-to-back."
 onChange={(checked) => setNonConsecutive(checked)}
 />
 </div>
 </div>
 )}

 {anyRegistrationTrigger && (
 <div
 className="np-notice"
 style={{ background: T.offWhite, borderRadius: T.radiusSm, marginTop: 12 }}
 >
 <Info size={16} style={{ color: T.textSecondary }} />
 <span style={{ color: T.textPrimary }}>
 A registration trigger already targets customers at registration;
 a new-customer window is redundant for that trigger.
 </span>
 </div>
 )}
 </section>

 {eventModalOpen && (
 <div role="dialog" aria-modal="true" aria-labelledby="np-event-modal-title">
 <div
 className="promo-modal__scrim"
 style={{ background: T.scrim }}
 onClick={() => setEventModalOpen(false)}
 />
 <div
 className="promo-modal__card np-modal-card--wide"
 style={{
 background: T.white,
 border: `1px solid ${T.border}`,
 borderRadius: T.radiusMd,
 }}
 >
 <h2
 id="np-event-modal-title"
 className="promo-modal__title"
 style={{ color: T.textPrimary }}
 >
 Add trigger event
 </h2>
 <div className="np-event-modal__body">
 {EVENT_CATALOG.map((category) => (
 <div key={category.label}>
 <h3 className="np-event-cat" style={{ color: T.textSecondary }}>
 {category.label}
 </h3>
 <div className="np-event-grid">
 {category.events.map((event) => (
 <button
 key={event.id}
 type="button"
 className="np-event-option"
 style={{
 border: `1px solid ${T.border}`,
 borderRadius: T.radiusSm,
 color: T.textPrimary,
 background: T.white,
 padding: 12,
 }}
 onClick={() => addTrigger(event.id as EventId)}
 >
 <span style={{ display: 'block', fontWeight: 500 }}>
 {event.label}
 </span>
 <span
 style={{
 display: 'block',
 color: T.textSecondary,
 fontSize: 12,
 marginTop: 4,
 lineHeight: 1.5,
 }}
 >
 {event.description}
 </span>
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>
 <div className="promo-modal__actions">
 <GhostButton onClick={() => setEventModalOpen(false)}>Cancel</GhostButton>
 </div>
 </div>
 </div>
 )}

 {confirmDeleteTrigger && (
 <div role="dialog" aria-modal="true" aria-labelledby="np-delete-trigger-title">
 <div
 className="promo-modal__scrim"
 style={{ background: T.scrim }}
 onClick={() => setConfirmDeleteTrigger(null)}
 />
 <div
 className="promo-modal__card"
 style={{
 background: T.white,
 border: `1px solid ${T.border}`,
 borderRadius: T.radiusMd,
 }}
 >
 <h2
 id="np-delete-trigger-title"
 className="promo-modal__title"
 style={{ color: T.textPrimary }}
 >
 Delete trigger?
 </h2>
 <p className="promo-modal__body" style={{ color: T.textSecondary }}>
 The &quot;{catalogEventLabel(confirmDeleteTrigger.eventId)}&quot; trigger
 and its {confirmDeleteTrigger.rules.length}{' '}
 {confirmDeleteTrigger.rules.length === 1 ? 'condition' : 'conditions'} will
 be removed from this promotion.
 </p>
 <div className="promo-modal__actions">
 <GhostButton onClick={() => setConfirmDeleteTrigger(null)}>Cancel</GhostButton>
 <DestructiveGhostButton onClick={deleteTrigger}>Delete trigger</DestructiveGhostButton>
 </div>
 </div>
 </div>
 )}
 </>
 );
}