/**
 * Operator catalog for the promotion rule builder (Step 2 → Advanced
 * conditions). Labels and stored values verbatim from
 * docs/legacy-step2-scope-triggers-spec.md (Step3Triggers) and
 * docs/legacy-eligibility-spec.md §2. Each operator declares its arity so
 * value widgets derive entirely from param type + operator arity — no
 * operator is referenced by literal string in a component.
 */
import type { ParamType } from './event-catalog';
import { isNumericType } from './event-catalog';

const ALL_TYPES: ParamType[] = ['integer', 'float', 'string', 'enum', 'boolean'];
const ORDERED_TYPES: ParamType[] = ['integer', 'float', 'string', 'enum'];
const TEXT_TYPES: ParamType[] = ['string', 'enum'];

/**
 * zero   — takes no value (value/value2 cleared)
 * single — one value input/select
 * list   — one comma-separated value
 * range  — two values: Min stored as value, Max as value2
 */
export type OperatorArity = 'zero' | 'single' | 'list' | 'range';

export interface RuleOperator {
  label: string;
  value: string;
  arity: OperatorArity;
 appliesTo: ParamType[];

}

/** Operator values used by the structured qualification rules. */
export const QUALIFICATION_OPERATOR_VALUES = {
  greaterOrEqual: '>=',
  equals: '=',
 notEquals: '!=',
} as const;

export const OPERATORS: RuleOperator[] = [
  { label: '> Greater Than', value: '>', arity: 'single', appliesTo: ORDERED_TYPES },
  { label: '≥ Greater or Equal', value: '>=', arity: 'single', appliesTo: ORDERED_TYPES },
  { label: '< Less Than', value: '<', arity: 'single', appliesTo: ORDERED_TYPES },
  { label: '≤ Less or Equal', value: '<=', arity: 'single', appliesTo: ORDERED_TYPES },
  { label: '= Equals', value: '=', arity: 'single', appliesTo: ALL_TYPES },
  { label: '≠ Not Equals', value: '!=', arity: 'single', appliesTo: ALL_TYPES },
  { label: '⇔ Between', value: 'between', arity: 'range', appliesTo: ORDERED_TYPES },
  { label: '⇎ Not Between', value: 'not_between', arity: 'range', appliesTo: ORDERED_TYPES },
  { label: 'IN List', value: 'in', arity: 'list', appliesTo: ALL_TYPES },
  { label: 'NOT IN List', value: 'not_in', arity: 'list', appliesTo: ALL_TYPES },
  { label: 'Contains', value: 'contains', arity: 'single', appliesTo: TEXT_TYPES },
  { label: 'Does Not Contain', value: 'not_contains', arity: 'single', appliesTo: TEXT_TYPES },
  { label: 'Is Set (has value)', value: 'is_set', arity: 'zero', appliesTo: ALL_TYPES },
  { label: 'Is Empty (no value)', value: 'is_empty', arity: 'zero', appliesTo: ALL_TYPES },
];

/** Catalog arity for a stored operator value — unknown operators fall back to 'single'. */
export function operatorsForType(type: ParamType | string): RuleOperator[] {
 return OPERATORS.filter((operator) => operator.appliesTo.includes(type as ParamType));
}

export function operatorArity(operator: string): OperatorArity {
  return OPERATORS.find((op) => op.value === operator)?.arity ?? 'single';
}

/** Legacy Step3Triggers default: '>' for integer/float params, '=' otherwise. */
export function defaultOperator(type: ParamType | string): string {
  return isNumericType(type) ? '>' : '=';
}

/** Range operators take two values (Min/Max, upper stored as value2). */
export function isRangeOperator(operator: string): boolean {
  return operatorArity(operator) === 'range';
}

/** Zero-arity operators take no value. */
export function isZeroArityOperator(operator: string): boolean {
  return operatorArity(operator) === 'zero';
}

/** List operators take one comma-separated value. */
export function isListOperator(operator: string): boolean {
  return operatorArity(operator) === 'list';
}
