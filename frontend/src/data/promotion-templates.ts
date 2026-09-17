/** Static catalog for the New Promotion wizard. */
import type { Qualification } from '@/app/admin/promotions/new/draft';
import type { Channel } from '@/lib/promotions';
import type { EventId } from '@/data/event-catalog';

export type TemplateId = 'welcome_offer' | 'cashback';
export type PromotionTypeId = 'welcome_offer' | 'cashback' | 'freebet_award' | 'odds_boost' | 'leaderboard' | 'missions' | 'deposit_match' | 'referral_reward';
export type ProductVertical = 'Sportsbook' | 'Aviator' | 'Casino' | 'Crash' | 'Virtuals';
export type RewardType = 'freebet' | 'cash';
export type PayoutMode = 'fixed' | 'tiers';
export type CreditTiming = 'instant' | 'next-day' | 'manual';
export type EndMode = 'date' | 'ongoing';

export interface PromotionTypeOption { id: PromotionTypeId; label: string; summary: string; enabled: boolean; }
export interface TierRow { odds: string; multiplier: string; }

export const PROMOTION_TYPES: PromotionTypeOption[] = [
 { id: 'welcome_offer', label: 'Welcome Offer', summary: 'Freebet reward for new customers with a daily qualifying-bet counter', enabled: true },
 { id: 'cashback', label: 'Cashback', summary: 'Cash back on qualifying bets, fixed or tiered by odds', enabled: true },
 { id: 'freebet_award', label: 'Freebet Award', summary: 'Direct freebet award on a qualifying action', enabled: true },
 { id: 'odds_boost', label: 'Odds Boost', summary: 'Boosted odds on selected events or markets', enabled: false },
 { id: 'leaderboard', label: 'Leaderboard', summary: 'Ranked competition rewarding top players by points or stakes', enabled: false },
 { id: 'missions', label: 'Missions', summary: 'Task-based rewards for completing defined player actions', enabled: false },
 { id: 'deposit_match', label: 'Deposit Match', summary: 'Match a percentage of a qualifying deposit as bonus', enabled: false },
 { id: 'referral_reward', label: 'Referral Reward', summary: 'Reward customers who refer new players', enabled: false },
];

export const PRODUCT_VERTICALS: ProductVertical[] = ['Sportsbook', 'Aviator', 'Casino', 'Crash', 'Virtuals'];

export const SEED_TIERS: TierRow[] = [
 { odds: '25', multiplier: '1' }, { odds: '45', multiplier: '2' }, { odds: '60', multiplier: '3' },
 { odds: '90', multiplier: '5' }, { odds: '450', multiplier: '10' }, { odds: '750', multiplier: '50' },
 { odds: '900', multiplier: '100' },
];

const BET_SETTLED_EVENT: EventId = 'bet_settled';

/** Draft fields a template may set, grouped by wizard step. */
export interface TemplatePrefill {
 /* Basics */ type?: PromotionTypeId; vertical?: ProductVertical;
 /* Qualification */ qualification?: Qualification; channels?: Channel[];
 /* Award */ rewardType?: RewardType; freebetCount?: string; freebetValue?: string; freebetExpiryHours?: string; payoutMode?: PayoutMode; fixedAmount?: string; tiers?: TierRow[]; payoutCap?: string; maxAwardsPerDay?: string; lifetimeCount?: string; lifetimeValue?: string; creditTiming?: CreditTiming; creditTime?: string; restrictedProduct?: string; wholeStakeOnly?: boolean; winningsExcludeStake?: boolean; withholdOtherOffers?: boolean;
 /* Budget */ budget?: string; alertThreshold?: string; alertRecipients?: string;
 /* Schedule */ startDate?: string; startTime?: string; endMode?: EndMode; endDate?: string; endTime?: string;
 /* Content */ shortDescription?: string;
}

export interface PromotionTemplate { id: TemplateId; name: string; caption: string; prefill: TemplatePrefill; }

export const PROMOTION_TEMPLATES: PromotionTemplate[] = [
 {
 id: 'welcome_offer', name: 'Aviator Welcome Offer',
 caption: 'Freebet reward for new customers with a daily qualifying-bet counter',

 prefill: {
 type: 'welcome_offer', vertical: 'Aviator',
      /* Mirrors seed PR-001: the Aviator welcome offer is an app + mobile web offer. */
      channels: ['app', 'mobile'],
 qualification: {
 triggers: [
 {
 id: 'welcome-trigger',
 eventId: BET_SETTLED_EVENT,
 rules: [
 { id: 'tpl-wo-stake', param: 'Stake', type: 'float', operator: '>=', value: '2.00' },
 { id: 'tpl-wo-result', param: 'Result', type: 'enum', operator: 'in', value: 'Cashed Out,Lost' },
 { id: 'tpl-wo-multiplier', param: 'Cash-out multiplier', type: 'float', operator: '>=', value: '2.00' },
 { id: 'tpl-wo-freebet', param: 'Free Bet', type: 'boolean', operator: '=', value: 'No' },
 { id: 'tpl-wo-voided', param: 'Voided', type: 'boolean', operator: '=', value: 'No' },
 { id: 'tpl-wo-cancelled', param: 'Cancelled', type: 'boolean', operator: '=', value: 'No' },
 ],
 },
 ],
 counting: [
 { id: 'tpl-wo-qualifying-bets-per-day', param: 'Qualifying bets per day', type: 'integer', operator: '>=', value: '10' },
 ],
 eligibility: { audience: 'new_customers', windowDays: 5, nonConsecutive: true },
 },
 rewardType: 'freebet',
 freebetCount: '5', freebetValue: '2.00', freebetExpiryHours: '24', maxAwardsPerDay: '5',
 lifetimeCount: '25', lifetimeValue: '50', creditTiming: 'next-day', creditTime: '14:00',
 restrictedProduct: 'Aviator', wholeStakeOnly: true, winningsExcludeStake: true,
 withholdOtherOffers: true, alertThreshold: '90', endMode: 'ongoing',
 shortDescription: 'Betika brings you exclusive and thrilling Aviator challenges like never before!',
 },
 },
 {
 id: 'cashback', name: 'Sportsbook Cashback',
 caption: 'Cash back on multibets with one lost leg, tiered by remaining odds',
 prefill: {
 type: 'cashback', vertical: 'Sportsbook',
 qualification: {
 triggers: [
 {
 id: 'cashback-trigger',
 eventId: BET_SETTLED_EVENT,
 rules: [
 { id: 'tpl-cb-bet-type', param: 'Bet Type', type: 'enum', operator: '=', value: 'Multibet' },
 { id: 'tpl-cb-stake', param: 'Stake', type: 'float', operator: '>=', value: '2.00' },
 { id: 'tpl-cb-result', param: 'Result', type: 'enum', operator: '=', value: 'Lost' },
 { id: 'tpl-cb-one-leg', param: 'Losing Legs', type: 'integer', operator: '=', value: '1' },
 { id: 'tpl-cb-odds', param: 'Remaining Odds', type: 'float', operator: '>=', value: '25' },
 { id: 'tpl-cb-freebet', param: 'Free Bet', type: 'boolean', operator: '=', value: 'No' },
 { id: 'tpl-cb-voided', param: 'Voided', type: 'boolean', operator: '=', value: 'No' },
 { id: 'tpl-cb-cancelled', param: 'Cancelled', type: 'boolean', operator: '=', value: 'No' },
 ],
 },
 ],
 counting: [],
 eligibility: { audience: 'all' },
 },
 rewardType: 'cash', payoutMode: 'tiers', tiers: SEED_TIERS.map((t) => ({ ...t })),
 payoutCap: '1000', creditTiming: 'next-day', creditTime: '14:00', alertThreshold: '90',
 endMode: 'ongoing', shortDescription: '',
 },
 },
];

/** Unknown IDs safely fall back to the first template. */
export function getTemplate(id: TemplateId): PromotionTemplate {
 return PROMOTION_TEMPLATES.find((tpl) => tpl.id === id) ?? PROMOTION_TEMPLATES[0];
}

export function getPromotionType(id: PromotionTypeId | ''): PromotionTypeOption | undefined {
 return PROMOTION_TYPES.find((type) => type.id === id);
}

/** Disabled types show a "TBC" suffix and cannot be picked. */
export function isTypeSelectable(id: PromotionTypeId): boolean {
 return PROMOTION_TYPES.some((type) => type.id === id && type.enabled);
}