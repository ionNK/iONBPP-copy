/**
 * Step 2 (Qualification) rules model — the single source of truth.
 * `qualification.triggers[].rules[]` holds every condition; Section 1 widgets
 * are views over rules tagged `source: 'widget'` + `widgetId`, and every
 * mutation here is pure so the component never edits rules by hand.
 * Events/params: src/data/event-catalog.ts; operators: src/data/operator-catalog.ts.
 */
import { getCatalogEvent, type EventParam } from '@/data/event-catalog';
import { QUALIFICATION_OPERATOR_VALUES, defaultOperator } from '@/data/operator-catalog';

export type RuleSource = 'widget' | 'user';

export interface TriggerRule {
  id: string;
  param: string;
  type: string;
  operator: string;
  value: string;
  value2?: string;
  source: RuleSource;
  widgetId?: string;
}

export interface Trigger {
  id: string;
  eventId: string;
  rules: TriggerRule[];
}

export interface Qualification {
  triggers: Trigger[];
  aggregation?: { countPerDay?: number; attributionNote: string };
  eligibility: {
    audience: 'all' | 'new_customers';
    windowDays?: number;
    nonConsecutive?: boolean;
  };
}

export const qualificationEventIds = {
  betSettled: 'bet_settled',
  accumulatorSettled: 'acca_bet_settled',
  aviatorBet: 'aviator_bet',
  aviatorCashout: 'aviator_cashout',
  aviatorCrash: 'aviator_crash',
} as const;

export const qualificationWidgetIds = {
  minimumStake: 'minimum_stake',
  excludeVoided: 'exclude_voided',
  exactlyOneLostLeg: 'exactly_one_lost_leg',
  minimumRemainingOdds: 'minimum_remaining_odds',
  cashoutMultiplier: 'cashout_multiplier',
  losingBetQualifies: 'losing_bet_qualifies',
} as const;

export type QualificationWidgetId = typeof qualificationWidgetIds[keyof typeof qualificationWidgetIds];
export type WidgetKind = 'money' | 'number' | 'toggle';

export interface WidgetDefinition {
  id: QualificationWidgetId;
  label: string;
  kind: WidgetKind;
  /** Operator the widget always writes (from the operator catalog). */
  operator: string;
  /** Catalog param name per event; `default` applies to any event not listed. */
  params: Record<string, string>;
  /** Value stored when a toggle widget is on. */
  toggleValue?: string;
  /** Owned by the Aviator second trigger — never offered on the primary trigger. */
  secondaryTrigger?: boolean;
}

/** Curated event choices for the primary qualifying event (subset of the catalog). */
export const qualifyingEventOptions: readonly string[] = [
  qualificationEventIds.betSettled,
  qualificationEventIds.accumulatorSettled,
  qualificationEventIds.aviatorBet,
  qualificationEventIds.aviatorCashout,
  qualificationEventIds.aviatorCrash,
];

/** Widget table — a widget renders only when the selected event exposes its param (see widgetParamFor). */
export const qualificationWidgets: WidgetDefinition[] = [
  {
    id: qualificationWidgetIds.minimumStake,
    label: 'Minimum stake',
    kind: 'money',
    operator: QUALIFICATION_OPERATOR_VALUES.greaterOrEqual,
    params: { default: 'Stake', [qualificationEventIds.aviatorCrash]: 'Stake Lost' },
  },
  {
    id: qualificationWidgetIds.excludeVoided,
    label: 'Exclude voided bets',
    kind: 'toggle',
    operator: QUALIFICATION_OPERATOR_VALUES.notEquals,
    params: { [qualificationEventIds.betSettled]: 'Outcome' },
    toggleValue: 'Void',
  },
  {
    id: qualificationWidgetIds.exactlyOneLostLeg,
    label: 'Qualifies with exactly one lost leg',
    kind: 'toggle',
    operator: QUALIFICATION_OPERATOR_VALUES.equals,
    params: { [qualificationEventIds.accumulatorSettled]: 'Losing Legs' },
    toggleValue: '1',
  },
  {
    id: qualificationWidgetIds.minimumRemainingOdds,
    label: 'Minimum remaining odds',
    kind: 'number',
    operator: QUALIFICATION_OPERATOR_VALUES.greaterOrEqual,
    params: { [qualificationEventIds.accumulatorSettled]: 'Min Odds per Leg' },
  },
  {
    id: qualificationWidgetIds.cashoutMultiplier,
    label: 'Cashed out at multiplier ≥',
    kind: 'number',
    operator: QUALIFICATION_OPERATOR_VALUES.greaterOrEqual,
    params: { [qualificationEventIds.aviatorCashout]: 'Multiplier' },
  },
  {
    id: qualificationWidgetIds.losingBetQualifies,
    label: 'Losing bets also qualify',
    kind: 'toggle',
    operator: QUALIFICATION_OPERATOR_VALUES.greaterOrEqual,
    params: { [qualificationEventIds.aviatorCrash]: 'Stake Lost' },
    secondaryTrigger: true,
  },
];


export const primaryTriggerId = 'primary-trigger';
export const crashTriggerId = 'aviator-crash-trigger';
export const attributionNote = 'Attribution: placement day, Africa/Lusaka';

/* Time-salted so IDs never collide with rules restored from localStorage. */
let nextRuleId = 0;
export function newQualificationId(prefix: 'trigger' | 'rule'): string {
  nextRuleId += 1;
  return `${prefix}-${Date.now().toString(36)}-${nextRuleId}`;
}

export function emptyQualification(): Qualification {
  return {
    triggers: [{ id: primaryTriggerId, eventId: qualificationEventIds.betSettled, rules: [] }],
    eligibility: { audience: 'all' },
  };
}

export function cloneQualification(qualification: Qualification): Qualification {
  return {
    ...qualification,
    triggers: qualification.triggers.map((trigger) => ({
      ...trigger,
      rules: trigger.rules.map((rule) => ({ ...rule })),
    })),
    aggregation: qualification.aggregation ? { ...qualification.aggregation } : undefined,
    eligibility: { ...qualification.eligibility },
  };
}

export function findWidgetRule(trigger: Trigger | undefined, widgetId: string): TriggerRule | undefined {
  return trigger?.rules.find((rule) => rule.source === 'widget' && rule.widgetId === widgetId);
}

export function primaryTrigger(qualification: Qualification): Trigger {
  return qualification.triggers.find((trigger) => trigger.id === primaryTriggerId) ?? qualification.triggers[0];
}

export function hasCrashTrigger(qualification: Qualification): boolean {
  return qualification.triggers.some((trigger) => trigger.id === crashTriggerId);
}

export function ruleCount(qualification: Qualification): number {
  return qualification.triggers.reduce((sum, trigger) => sum + trigger.rules.length, 0);
}

export function widgetDefinition(widgetId: string): WidgetDefinition | undefined {
  return qualificationWidgets.find((widget) => widget.id === widgetId);
}

/** Catalog param a widget binds to on the given event — undefined means "hide this widget". */
export function widgetParamFor(eventId: string, widgetId: string): EventParam | undefined {
  const widget = widgetDefinition(widgetId);
  const name = widget?.params[eventId] ?? widget?.params.default;
  return name ? getCatalogEvent(eventId)?.params.find((param) => param.name === name) : undefined;
}

/** Section 1 widgets applicable to the primary trigger's event. */
export function primaryWidgetsFor(eventId: string): WidgetDefinition[] {
  return qualificationWidgets.filter((widget) => !widget.secondaryTrigger && Boolean(widgetParamFor(eventId, widget.id)));
}

function buildWidgetRule(eventId: string, widgetId: QualificationWidgetId, value: string): TriggerRule | undefined {
  const widget = widgetDefinition(widgetId);
  const param = widgetParamFor(eventId, widgetId);
  if (!widget || !param) return undefined;
  return { id: newQualificationId('rule'), param: param.name, type: param.type, operator: widget.operator, value, source: 'widget', widgetId };
}

function mapTrigger(qualification: Qualification, triggerId: string, fn: (trigger: Trigger) => Trigger): Qualification {
  return { ...qualification, triggers: qualification.triggers.map((trigger) => (trigger.id === triggerId ? fn(trigger) : trigger)) };
}

/** Upsert (enabled) or remove (disabled) the single rule a widget owns on a trigger. */
export function setWidgetRule(qualification: Qualification, triggerId: string, widgetId: QualificationWidgetId, value: string, enabled = true): Qualification {
  return mapTrigger(qualification, triggerId, (trigger) => {
    const existing = findWidgetRule(trigger, widgetId);
    if (!enabled) return { ...trigger, rules: trigger.rules.filter((rule) => rule !== existing) };
    if (existing) return { ...trigger, rules: trigger.rules.map((rule) => (rule === existing ? { ...rule, value } : rule)) };
    const next = buildWidgetRule(trigger.eventId, widgetId, value);
    return next ? { ...trigger, rules: [...trigger.rules, next] } : trigger;
  });
}

/** Whether a rule remains valid when its trigger event changes. */
function ruleAppliesToEvent(rule: TriggerRule, eventId: string): boolean {
 if (rule.source === 'widget') return Boolean(widgetParamFor(eventId, rule.widgetId ?? ''));
 return Boolean(getCatalogEvent(eventId)?.params.some((param) => param.name === rule.param));
}

/** Rules whose parameter is absent on the new event are dropped after confirmation. */
export function switchPrimaryEvent(qualification: Qualification, eventId: string): Qualification {
 return mapTrigger(qualification, primaryTrigger(qualification).id, (trigger) => ({
 ...trigger,
 eventId,
 rules: trigger.rules.filter((rule) => ruleAppliesToEvent(rule, eventId)),
 }));
}

export function rulesLostBySwitch(qualification: Qualification, eventId: string): TriggerRule[] {
 return primaryTrigger(qualification).rules.filter((rule) => !ruleAppliesToEvent(rule, eventId));
}

export function syncCrashTrigger(qualification: Qualification, enabled: boolean, stakeValue: string): Qualification {
 const triggers = qualification.triggers.filter((trigger) => trigger.id !== crashTriggerId);
 if (!enabled) return { ...qualification, triggers };
 const rule = buildWidgetRule(qualificationEventIds.aviatorCrash, qualificationWidgetIds.losingBetQualifies, stakeValue);
 return { ...qualification, triggers: [...triggers, { id: crashTriggerId, eventId: qualificationEventIds.aviatorCrash, rules: rule ? [rule] : [] }] };
}

export function addTrigger(qualification: Qualification, eventId: string): Qualification {
 return { ...qualification, triggers: [...qualification.triggers, { id: newQualificationId('trigger'), eventId, rules: [] }] };
}

export function removeTrigger(qualification: Qualification, triggerId: string): Qualification {
 if (triggerId === primaryTrigger(qualification).id) return qualification;
 return { ...qualification, triggers: qualification.triggers.filter((trigger) => trigger.id !== triggerId) };
}

export function addUserRule(qualification: Qualification, triggerId: string, param: EventParam): Qualification {
 return mapTrigger(qualification, triggerId, (trigger) => ({
 ...trigger,
 rules: [...trigger.rules, { id: newQualificationId('rule'), param: param.name, type: param.type, operator: defaultOperator(param.type), value: '', source: 'user' }],
 }));
}

export function updateUserRule(qualification: Qualification, triggerId: string, ruleId: string, patch: Partial<TriggerRule>): Qualification {
 return mapTrigger(qualification, triggerId, (trigger) => ({ ...trigger, rules: trigger.rules.map((rule) => rule.id === ruleId ? { ...rule, ...patch } : rule) }));
}

export function removeUserRule(qualification: Qualification, triggerId: string, ruleId: string): Qualification {
 return mapTrigger(qualification, triggerId, (trigger) => ({ ...trigger, rules: trigger.rules.filter((rule) => rule.id !== ruleId) }));
}

export function setAggregation(qualification: Qualification, countPerDay: number | undefined): Qualification {
 return countPerDay === undefined ? { ...qualification, aggregation: undefined } : { ...qualification, aggregation: { countPerDay, attributionNote } };
}

export function setEligibility(qualification: Qualification, eligibility: Qualification['eligibility']): Qualification {
 return { ...qualification, eligibility };
}

export const qualificationOperators = QUALIFICATION_OPERATOR_VALUES;
