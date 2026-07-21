// Pre-seeded promotion templates + matching promotion records.
//
// These give the prototype a set of realistic, ready-to-launch offers so the
// Templates page and Promotions list are populated on first load. Each template
// is a full WizardState snapshot built from a small set of overrides on top of a
// sensible base, keeping this file compact.

import type { PromotionTemplate } from '@/context/TemplatesContext';
import type { WizardState } from '@/context/WizardContext';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

// A neutral base WizardState the seed offers are built from.
const base: WizardState = {
  basics: { name: '', description: '', type: '' },
  eligibility: {
    markets: ['KE'],
    primaryMarket: 'KE',
    channels: ['desktop', 'mobile'],
    segment: '',
    customSegments: [],
    triggers: [],
  },
  rewards: {
    type: 'bonus',
    calcType: 'simple',
    matrixDimension: 'week',
    tiers: [
      { id: 1, dimensionKey: 'week', dimensionValue: 'Week 1', segment: 'All Segments', percentage: '10', cap: '100' },
    ],
    simpleConfig: { percentage: '100', cap: '500' },
    wagering: 5,
    creditTiming: 'instant',
    freebet: {
      unitValue: '2',
      currency: 'KES',
      targetGame: 'Aviator',
      countPerAward: '5',
      maxTotalCap: '25',
      expiryHours: '24',
      creditByTime: '14:00',
      stakeReturned: false,
    },
    qualifyingBet: {
      enabled: false,
      game: 'Aviator',
      minStake: '2',
      minMultiplier: '2.00',
      countPerDay: '10',
      countLosingBets: true,
    },
    multiDay: {
      enabled: false,
      windowDays: '5',
      startFromRegistration: true,
      nonConsecutive: true,
      newCustomersOnly: true,
    },
  },
  schedule: {
    startDate: '2026-02-01T00:00',
    endDate: '2026-03-01T00:00',
    isRecurring: false,
    recurrence: { frequency: 'Weekly', days: [] },
    limits: { totalClaims: '', perPlayer: '1', budget: '' },
  },
  display: {
    activeTab: 'display',
    title: '',
    teaser: '',
    bannerImage: '',
    termsAndConditions: 'Standard terms and conditions apply. 18+. Play responsibly.',
    badges: ['NEW'],
    communication: {
      smsEnabled: true,
      pushEnabled: false,
      smsTemplate: 'Hi {{player_name}}, you have qualified for our promotion! Check your account for details.',
    },
  },
};

// Shallow-merge one level of nested sections onto the base state.
function buildPayload(overrides: DeepPartial<WizardState>): WizardState {
  return {
    basics: { ...base.basics, ...(overrides.basics as object) },
    eligibility: { ...base.eligibility, ...(overrides.eligibility as object) },
    rewards: {
      ...base.rewards,
      ...(overrides.rewards as object),
      simpleConfig: { ...base.rewards.simpleConfig, ...(overrides.rewards?.simpleConfig as object) },
      freebet: { ...base.rewards.freebet, ...(overrides.rewards?.freebet as object) },
      qualifyingBet: { ...base.rewards.qualifyingBet, ...(overrides.rewards?.qualifyingBet as object) },
      multiDay: { ...base.rewards.multiDay, ...(overrides.rewards?.multiDay as object) },
    },
    schedule: {
      ...base.schedule,
      ...(overrides.schedule as object),
      recurrence: { ...base.schedule.recurrence, ...(overrides.schedule?.recurrence as object) },
      limits: { ...base.schedule.limits, ...(overrides.schedule?.limits as object) },
    },
    display: {
      ...base.display,
      ...(overrides.display as object),
      communication: { ...base.display.communication, ...(overrides.display?.communication as object) },
    },
  };
}

interface SeedDef {
  id: string;
  name: string;
  description: string;
  basedOnType: string;
  market: string;
  overrides: DeepPartial<WizardState>;
}

const SEED_DEFS: SeedDef[] = [
  {
    id: 'tpl_seed_welcome',
    name: 'Welcome Bonus — 100% up to KES 5,000',
    description: 'Match a new customer’s first deposit 100% up to KES 5,000 with 5x wagering.',
    basedOnType: 'welcome_bonus',
    market: 'KE',
    overrides: {
      basics: { name: 'Welcome Bonus — 100% up to KES 5,000', description: 'First-deposit match for new customers.', type: 'welcome_bonus' },
      eligibility: { segment: 'New Users', primaryMarket: 'KE', markets: ['KE'] },
      rewards: { type: 'bonus', calcType: 'simple', wagering: 5, simpleConfig: { percentage: '100', cap: '5000' } },
      display: { title: 'Double Your First Deposit', teaser: '100% match up to KES 5,000', badges: ['NEW', 'HOT'] },
    },
  },
  {
    id: 'tpl_seed_accaboost',
    name: 'Acca Insurance — Refund up to KES 1,000',
    description: 'Refund an accumulator of 5+ legs as a free bet when exactly one leg loses.',
    basedOnType: 'acca_insurance',
    market: 'KE',
    overrides: {
      basics: { name: 'Acca Insurance — Refund up to KES 1,000', description: 'Get your stake back if one leg lets you down.', type: 'acca_insurance' },
      eligibility: { segment: 'Sportsbook Players' },
      rewards: { type: 'freebets', calcType: 'simple', simpleConfig: { percentage: '100', cap: '1000' }, freebet: { unitValue: '1000', currency: 'KES', targetGame: 'Aviator', expiryHours: '168' } },
      display: { title: 'Acca Insurance', teaser: 'One leg lets you down? We’ve got your back.', badges: ['HOT'] },
    },
  },
  {
    id: 'tpl_seed_cashback',
    name: 'Weekly Cashback — 10% up to KES 2,000',
    description: 'Return 10% of net weekly losses as bonus, capped at KES 2,000.',
    basedOnType: 'cashback',
    market: 'KE',
    overrides: {
      basics: { name: 'Weekly Cashback — 10% up to KES 2,000', description: 'Get a slice of your weekly losses back.', type: 'cashback' },
      eligibility: { segment: 'Active Players' },
      rewards: { type: 'bonus', calcType: 'simple', wagering: 3, simpleConfig: { percentage: '10', cap: '2000' } },
      schedule: { isRecurring: true, recurrence: { frequency: 'Weekly', days: ['Mon'] } },
      display: { title: 'Weekly Cashback', teaser: '10% back every week', badges: ['NEW'] },
    },
  },
  {
    id: 'tpl_seed_aviator',
    name: 'Aviator Free Rounds — 25 x KES 2',
    description: 'Drop 25 free Aviator rounds worth KES 2 each to active players.',
    basedOnType: 'aviator_free_rounds',
    market: 'KE',
    overrides: {
      basics: { name: 'Aviator Free Rounds — 25 x KES 2', description: 'Free rounds for our Aviator fans.', type: 'aviator_free_rounds' },
      eligibility: { segment: 'Casino Players' },
      rewards: { type: 'freerounds', calcType: 'simple', wagering: 10, freebet: { unitValue: '2', currency: 'KES', targetGame: 'Aviator', countPerAward: '5', maxTotalCap: '25', expiryHours: '48' } },
      display: { title: 'Free Aviator Rounds', teaser: '25 free rounds — fly high!', badges: ['HOT'] },
    },
  },
  {
    id: 'tpl_seed_betget',
    name: 'Bet & Get — KES 500 Free Bet',
    description: 'Place a KES 200+ bet at 2.00+ odds and get a KES 500 free bet.',
    basedOnType: 'bet_get',
    market: 'KE',
    overrides: {
      basics: { name: 'Bet & Get — KES 500 Free Bet', description: 'Reward for placing a qualifying bet.', type: 'bet_get' },
      eligibility: { segment: 'Sportsbook Players' },
      rewards: {
        type: 'freebets',
        calcType: 'simple',
        freebet: { unitValue: '500', currency: 'KES', targetGame: 'Aviator', expiryHours: '72' },
        qualifyingBet: { enabled: true, game: 'Sportsbook', minStake: '200', minMultiplier: '2.00', countPerDay: '1', countLosingBets: true },
      },
      display: { title: 'Bet & Get Free Bet', teaser: 'Bet KES 200, get KES 500 free', badges: ['NEW'] },
    },
  },
];

const now = '2026-02-01T00:00:00.000Z';

export const SEED_TEMPLATES: PromotionTemplate[] = SEED_DEFS.map((d) => ({
  id: d.id,
  name: d.name,
  description: d.description,
  basedOnType: d.basedOnType,
  market: d.market,
  payload: buildPayload(d.overrides),
  createdAt: now,
  updatedAt: now,
}));

// Matching promotion records for the Promotions list (localStorage: saved_promotions).
export const SEED_PROMOTIONS_FROM_TEMPLATES = SEED_DEFS.map((d, i) => ({
  id: `PRM-SEED-${String(i + 1).padStart(3, '0')}`,
  name: d.name,
  type: d.basedOnType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  status: i % 3 === 2 ? 'paused' : 'active',
  segment: (d.overrides.eligibility as { segment?: string })?.segment || 'All Players',
  stats: { claims: 0, cost: '-', conversion: '-' },
  period: 'Feb 1 - Ongoing',
  _templateId: d.id,
}));
