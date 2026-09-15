/**
* Award cadence semantics: per-day params award once per qualifying day;
* total params award once when the threshold is reached.
*/
import type { EventParam } from './event-catalog';

/** Typed counting params for the How often group. */
export const AGGREGATION_PARAMS: EventParam[] = [
  { name: 'Qualifying bets per day', type: 'integer' },
{ name: 'Qualifying bets total', type: 'integer' },
{ name: 'Total stake per day (ZMW)', type: 'float' },
{ name: 'Total stake overall (ZMW)', type: 'float' },
];
