/**
 * Proposed consumed-events contract, pending confirmation with platform
 * engineering (OPPR-14). Extend by adding entries, never UI. Derived params
 * (Remaining Odds) and event-envelope fields (Channel, player context) need
 * engineering confirmation.
 */

export type ParamType = 'integer' | 'float' | 'string' | 'enum' | 'boolean';

export interface EventParam {
 name: string;
 type: ParamType;
 /** Betting picker groups; shared player context is grouped separately. */
 group?: 'bet' | 'result';
 /** Enum parameters only, rendered as select or checkbox options. */
 options?: string[];
}

export interface CatalogEvent {
 id: string;
 label: string;
 description: string;
 params: EventParam[];
}

export interface EventCategory {
 label: string;
 events: CatalogEvent[];
}

/** Generic lifecycle event IDs; product vertical is scoped in Step 1 Basics. */
export const QUALIFICATION_EVENT_IDS = {
 betPlaced: 'bet_placed',
 betSettled: 'bet_settled',
 deposit: 'deposit',
 withdrawal: 'withdrawal',
 registration: 'registration',
 login: 'login',
} as const;

/** Union of valid event IDs: type trigger.eventId against this. */
export type EventId =
 (typeof QUALIFICATION_EVENT_IDS)[keyof typeof QUALIFICATION_EVENT_IDS];

/** Boolean rule values use the same labels in storage and in controls. */
export const BOOLEAN_OPTIONS = ['Yes', 'No'];

/** Checkbox-only exclusions, shared by qualification editing and Review readback. */
export const BET_RESTRICTIONS = [
 { param: 'Free Bet', label: 'Bets placed using free bets', summary: 'free-bet stakes', warning: 'Free-bet stakes are allowed to qualify' },
 { param: 'Voided', label: 'Voided bets', summary: 'voided bets', warning: 'Voided bets are allowed to qualify' },
 { param: 'Cancelled', label: 'Cancelled bets', summary: 'cancelled bets', warning: 'Cancelled bets are allowed to qualify' },
];

/** Shared context params for every event's picker under the PLAYER group. */
export const PLAYER_PARAMS: EventParam[] = [
 { name: 'Days since registration', type: 'integer' },
 { name: 'KYC verified', type: 'boolean' },
 { name: 'Deposits count', type: 'integer' },
 { name: 'First deposit made', type: 'boolean' },
];

export const EVENT_CATALOG: EventCategory[] = [
 {
 label: 'BETTING',
 events: [
 {
 id: QUALIFICATION_EVENT_IDS.betPlaced,
 label: 'Bet Placed',
 description: 'Fires when a bet is placed. Reserved for activity-based promotions.',
 // Placement-triggered promos TBD: no launch promo consumes this event.
 params: [
 { name: 'Bet Type', type: 'enum', group: 'bet', options: ['Single', 'Multibet'] },
 { name: 'Channel', type: 'enum', group: 'bet', options: ['Web', 'Mobile Web', 'App', 'USSD'] },
 { name: 'Stake', type: 'float', group: 'bet' },
 { name: 'Odds', type: 'float', group: 'bet' },
 { name: 'Live', type: 'boolean', group: 'bet' },
 ],
 },
 {
 id: QUALIFICATION_EVENT_IDS.betSettled,
 label: 'Bet Settled',
 description: 'Fires when all selections are resulted. Use for outcome-based promotions.',
 params: [
 { name: 'Stake', type: 'float', group: 'bet' },
 { name: 'Bet Type', type: 'enum', group: 'bet', options: ['Single', 'Multibet'] },
 { name: 'Channel', type: 'enum', group: 'bet', options: ['Web', 'Mobile Web', 'App', 'USSD'] },
 { name: 'Free Bet', type: 'boolean', group: 'bet' },
 { name: 'Result', type: 'enum', group: 'result', options: ['Won', 'Lost', 'Cashed Out'] },
 { name: 'Cash-out multiplier', type: 'float', group: 'result' },
 { name: 'Voided', type: 'boolean', group: 'result' },
 { name: 'Cancelled', type: 'boolean', group: 'result' },
 { name: 'Losing Legs', type: 'integer', group: 'result' },
 { name: 'Remaining Odds', type: 'float', group: 'result' },
 { name: 'Payout', type: 'float', group: 'result' },
 ],
 },
 ],
 },
 {
 label: 'WALLET',
 events: [
 {
 id: QUALIFICATION_EVENT_IDS.deposit,
 label: 'Deposit',
 description: 'Fires when a deposit completes.',
 params: [
 { name: 'Amount', type: 'float' },
 {
 name: 'Method',
 type: 'enum',
 options: ['Mpesa', 'AirtelMoney', 'Cashia', 'Card', 'BankTransfer', 'Voucher'],
 },
 {
 name: 'Channel',
 type: 'enum',
 options: ['Web', 'Mobile Web', 'App', 'USSD'],
 },
 { name: 'First Deposit', type: 'boolean' },
 ],
 },
 {
 id: QUALIFICATION_EVENT_IDS.withdrawal,
 label: 'Withdrawal',
 description: 'Fires on withdrawal request or completion.',
 params: [
 { name: 'Amount', type: 'float' },
 {
 name: 'Status',
 type: 'enum',
 options: ['Requested', 'Completed'],
 },
 ],
 },
 ],
 },
 {
 label: 'LIFECYCLE',
 events: [
 {
 id: QUALIFICATION_EVENT_IDS.registration,
 label: 'Registration',
 description: 'Fires when a new account is created.',
 params: [
 {
 name: 'Method',
 type: 'enum',
 options: ['SMS', 'Web', 'App'],
 },
 { name: 'Referral Code', type: 'string' },
 ],
 },
 {
 id: QUALIFICATION_EVENT_IDS.login,
 label: 'Login',
 description: 'Fires when a player logs in.',
 params: [
 { name: 'Days Inactive', type: 'integer' },
 { name: 'Platform', type: 'string' },
 ],
 },
 ],
 },
];

/** Flat lookup across all categories. Unknown IDs return undefined. */
export function getCatalogEvent(eventId: string): CatalogEvent | undefined {
 for (const category of EVENT_CATALOG) {
 const found = category.events.find((event) => event.id === eventId);
 if (found) return found;
 }

 return undefined;
}

/**
 * Display label for an event ID: 'Unknown Event' for an empty ID, the raw
 * ID for a nonempty unrecognized ID (legacy fallback behavior).
 */
export function catalogEventLabel(eventId: string): string {
 const found = getCatalogEvent(eventId);
 if (found) return found.label;

 return eventId === '' ? 'Unknown Event' : eventId;
}

/** Whether a parameter type uses numeric value controls. */
export function isNumericType(type: ParamType | string): boolean {
 return type === 'integer' || type === 'float';
}