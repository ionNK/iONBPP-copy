// Dynamic Segmentation Engine (CRM Phase 2)
// A saved segment is a set of rules (predicates) combined with AND/OR.
// Membership is computed live against the synced player base — never stored.

import { Player, getPlayers, PlayerLifecycle } from './players';

export type FieldType = 'number' | 'string' | 'enum' | 'boolean' | 'date';

export type Operator =
  // Equality (all types)
  | 'eq' | 'neq'
  // Presence (all types) — no value input
  | 'is_null' | 'is_not_null'
  // Numeric / date comparison
  | 'gt' | 'gte' | 'lt' | 'lte'
  // Range (two value inputs joined by AND)
  | 'between' | 'not_between'
  // String
  | 'begins_with' | 'not_begins_with'
  | 'contains' | 'not_contains'
  | 'is_empty' | 'is_not_empty';

// A date-relative unit for real-time recency comparisons.
export type DateUnit = 'minutes' | 'hours' | 'days' | 'months';

export const DATE_UNITS: { value: DateUnit; label: string }[] = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'months', label: 'Months' },
];

// How many value inputs an operator needs the user to fill in:
//   0 = none (is null / is empty …)
//   1 = single value
//   2 = range (between / not between) → render two inputs joined by "AND"
export const OPERATOR_ARITY: Record<Operator, 0 | 1 | 2> = {
  eq: 1, neq: 1,
  is_null: 0, is_not_null: 0,
  gt: 1, gte: 1, lt: 1, lte: 1,
  between: 2, not_between: 2,
  begins_with: 1, not_begins_with: 1,
  contains: 1, not_contains: 1,
  is_empty: 0, is_not_empty: 0,
};

export function operatorArity(op: Operator): 0 | 1 | 2 {
  return OPERATOR_ARITY[op];
}

export interface Rule {
  id: string;
  field: string;          // key into Player (or a derived field)
  operator: Operator;
  value: string | number | boolean;
  /** Upper bound for range operators (between / not between). */
  value2?: string | number;
  /** Unit for date fields (minutes / hours / days / months). */
  unit?: DateUnit;
}


export interface Segment {
  id: string;
  name: string;
  description?: string;
  match: 'all' | 'any';   // AND / OR across rules
  rules: Rule[];
  createdAt: string;
  updatedAt: string;
  preset?: boolean;       // built-in, non-deletable
}

// ---- Field catalogue (what operators each field supports) ----------------

export type FieldGroup =
  | 'Profile'
  | 'Contact'
  | 'Value'
  | 'Behaviour'
  | 'Sportsbook'
  | 'Bonuses'
  | 'Engagement'
  | 'Comms'
  | 'Risk'
  | 'Consent'
  | 'Player Features';

// Display-only formatting hint for the builder / preview (does not affect evalRule).
export type FieldFormat = 'currency' | 'ratio' | 'percent' | 'integer';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  group: FieldGroup;
  options?: { value: string; label: string }[];
  operators: Operator[];
  /** Display-only formatting hint. */
  format?: FieldFormat;
  /** Curated high-value field — populated with realistic mock data. */
  core?: boolean;
  /** Short help text surfaced in the field picker. */
  description?: string;
}

// Per-type operator catalogues (mirrors the operator matrix).
const STRING_OPS: Operator[] = [
  'eq', 'neq', 'begins_with', 'not_begins_with', 'contains', 'not_contains',
  'is_empty', 'is_not_empty', 'is_null', 'is_not_null',
];
const NUM_OPS: Operator[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'not_between', 'is_null', 'is_not_null'];
const ENUM_OPS: Operator[] = ['eq', 'neq', 'is_null', 'is_not_null'];
const BOOL_OPS: Operator[] = ['eq', 'neq', 'is_null', 'is_not_null'];
// Date fields compare the elapsed time since the timestamp against a value + unit.
const DATE_OPS: Operator[] = ['eq', 'lt', 'lte', 'gt', 'gte', 'between', 'not_between', 'is_null', 'is_not_null'];


const LIFECYCLE_OPTS: { value: string; label: string }[] = [
  { value: 'new', label: 'New' }, { value: 'active', label: 'Active' },
  { value: 'vip', label: 'VIP' }, { value: 'at_risk', label: 'At Risk' },
  { value: 'dormant', label: 'Dormant' }, { value: 'churned', label: 'Churned' },
  { value: 'reactivated', label: 'Reactivated' },
];

const opt = (...vals: string[]) => vals.map((v) => ({ value: v, label: v }));

const ACCOUNT_OPTS = [
  { value: 'open', label: 'Open' }, { value: 'suspended', label: 'Suspended' },
  { value: 'self_excluded', label: 'Self-excluded' }, { value: 'closed', label: 'Closed' },
];
const VALUE_TIER_OPTS = opt('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond');
const CHANNEL_OPTS = [
  { value: 'web', label: 'Web' }, { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' }, { value: 'ussd', label: 'USSD' }, { value: 'retail', label: 'Retail' },
];
const BET_TYPE_OPTS = [
  { value: 'single', label: 'Single' }, { value: 'multi', label: 'Multi / Accumulator' },
  { value: 'system', label: 'System' }, { value: 'live', label: 'Live / In-play' },
];

// ---- FT CRM enum option lists --------------------------------------------
const CURRENCY_OPTS = opt('KES', 'GHS', 'TZS', 'ETB', 'NGN', 'UGX', 'ZMW', 'USD', 'EUR', 'GBP');
const COUNTRY_OPTS = opt('Kenya', 'Ghana', 'Tanzania', 'Ethiopia', 'Nigeria', 'Uganda', 'Zambia', 'South Africa');
const LANGUAGE_OPTS = opt('English', 'Swahili', 'Amharic', 'French', 'Hausa', 'Yoruba', 'Portuguese');
const SEX_OPTS = [
  { value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'O', label: 'Other' },
];
const TITLE_OPTS = opt('Mr', 'Mrs', 'Ms', 'Dr', 'Prof');
const ENGAGEMENT_OPTS = [
  { value: 'Dead', label: 'Dead' }, { value: 'Very Low', label: 'Very Low' },
  { value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' }, { value: 'Very High', label: 'Very High' },
  { value: 'Sky-High', label: 'Sky-High' },
];

// ---- Player Features enum option lists (FT CRM) --------------------------
const ACQUISITION_OPTS = [
  { value: 'direct', label: 'Direct' }, { value: 'affiliate', label: 'Affiliate' },
];
const ACTIVE_STATE_OPTS = [
  { value: 'active_today', label: 'Active today' }, { value: 'idle_1', label: 'Idle (1 day)' },
  { value: 'idle_2', label: 'Idle (2 days)' }, { value: 'idle_5', label: 'Idle (5 days)' },
  { value: 'idle_10', label: 'Idle (10 days)' }, { value: 'idle_20', label: 'Idle (20 days)' },
  { value: 'inactive', label: 'Inactive' }, { value: 'never_active', label: 'Never Active' },
];
const INACTIVE_STATE_OPTS = [
  { value: 'active', label: 'Active' }, { value: 'inactive_30', label: 'Inactive (30 days)' },
  { value: 'inactive_90', label: 'Inactive (90 days)' }, { value: 'inactive_180', label: 'Inactive (180 days)' },
  { value: 'never_active', label: 'Never Active' },
];
const CONVERSION_STATE_OPTS = [
  { value: 'registered', label: 'Registered' }, { value: 'freeplay', label: 'Freeplay' },
  { value: '1st_deposit', label: '1st Deposit' }, { value: '2nd_deposit', label: '2nd Deposit' },
  { value: '3rd_deposit', label: '3rd Deposit' }, { value: 'converted', label: 'Converted' },
];
const LIFESTAGE_OPTS = [
  { value: 'new', label: 'New' }, { value: 'developing', label: 'Developing' },
  { value: 'established', label: 'Established' }, { value: 'mature', label: 'Mature' },
  { value: 'declining', label: 'Declining' }, { value: 'lapsed', label: 'Lapsed' },
];
const DAY_OF_WEEK_OPTS = opt('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
const OPTIMAL_TIME_OPTS = [
  { value: 'morning', label: 'Morning (06:00–12:00)' }, { value: 'afternoon', label: 'Afternoon (12:00–17:00)' },
  { value: 'evening', label: 'Evening (17:00–22:00)' }, { value: 'night', label: 'Night (22:00–06:00)' },
];
const ONLINE_STATE_OPTS = [
  { value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' },
];
const DEPOSIT_BRACKET_OPTS = [
  { value: 'very_low', label: 'Very Low' }, { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'very_high', label: 'Very High' },
];
const OFFER_TYPE_OPTS = [
  { value: 'free_bet', label: 'Free Bet' }, { value: 'deposit_match', label: 'Deposit Match' },
  { value: 'cashback', label: 'Cashback' }, { value: 'free_spins', label: 'Free Spins' },
  { value: 'odds_boost', label: 'Odds Boost' }, { value: 'risk_free', label: 'Risk-Free Bet' },
];
const COST_EFFICIENT_CHANNEL_OPTS = [
  { value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push' }, { value: 'onsite', label: 'On-site' },
];
const PRODUCT_PLAYED_OPTS = [
  { value: 'sportsbook', label: 'Sportsbook' }, { value: 'casino', label: 'Casino' },
  { value: 'live_casino', label: 'Live Casino' }, { value: 'virtuals', label: 'Virtuals' },
  { value: 'aviator', label: 'Aviator / Crash' }, { value: 'jackpot', label: 'Jackpot' },
];

// ---- FT CRM extended catalogue -------------------------------------------
// Full Fast Track-parity attribute set. Grouped for the picker. Values are
// materialised per player by enrichPlayer() in players.ts, so segment rules
// against these keys evaluate correctly against the synced base.
const num = (key: string, label: string, group: FieldGroup, format?: FieldFormat, description?: string): FieldDef =>
  ({ key, label, type: 'number', group, operators: NUM_OPS, format, description });
const str = (key: string, label: string, group: FieldGroup, description?: string): FieldDef =>
  ({ key, label, type: 'string', group, operators: STRING_OPS, description });
const en = (key: string, label: string, group: FieldGroup, options: { value: string; label: string }[], description?: string): FieldDef =>
  ({ key, label, type: 'enum', group, options, operators: ENUM_OPS, description });
const bool = (key: string, label: string, group: FieldGroup, description?: string): FieldDef =>
  ({ key, label, type: 'boolean', group, operators: BOOL_OPS, description });
const date = (key: string, label: string, group: FieldGroup, description?: string): FieldDef =>
  ({ key, label, type: 'date', group, operators: DATE_OPS, description });

export const FT_CRM_FIELDS: FieldDef[] = [
  // ---- Contact ----------------------------------------------------------
  str('firstName', 'First Name', 'Contact'),
  str('lastName', 'Last Name', 'Contact'),
  en('title', 'Title', 'Contact', TITLE_OPTS),
  en('sex', 'Sex', 'Contact', SEX_OPTS),
  str('address', 'Address', 'Contact'),
  str('city', 'City', 'Contact'),
  str('postalCode', 'Postal Code', 'Contact'),
  en('language', 'Language', 'Contact', LANGUAGE_OPTS),
  en('currencyPref', 'Currency', 'Contact', CURRENCY_OPTS),
  en('countryCode', 'Country', 'Contact', COUNTRY_OPTS),
  str('mobileNumber', 'Mobile Number', 'Contact'),
  str('affiliateReference', 'Affiliate Reference', 'Contact'),
  num('age', 'Age', 'Contact', 'integer'),
  date('birthDate', 'Birth Date', 'Contact'),

  // ---- Value ------------------------------------------------------------
  en('valueTier', 'Value Tier', 'Value', VALUE_TIER_OPTS),
  num('ggr', 'GGR', 'Value', 'currency'),
  num('averageDepositAmount', 'Average Deposit Amount', 'Value', 'currency'),
  num('averageWithdrawalAmount', 'Average Withdrawal Amount', 'Value', 'currency'),
  num('totalWithdrawals', 'Total Withdrawals', 'Value', 'currency'),
  num('depositCount', 'Deposit Count', 'Value', 'integer'),
  num('withdrawalCount', 'Withdrawal Count', 'Value', 'integer'),
  num('netDeposits', 'Net Deposits', 'Value', 'currency'),
  num('withdrawalToDepositRatio', 'Withdrawal to Deposit Ratio', 'Value', 'ratio'),
  num('ggrBonusRatio', 'GGR Bonus Ratio', 'Value', 'ratio'),
  num('realBalance', 'Real Balance', 'Value', 'currency'),
  num('bonusBalance', 'Bonus Balance', 'Value', 'currency'),

  // ---- Behaviour --------------------------------------------------------
  num('totalSessions', 'Total Sessions', 'Behaviour', 'integer'),
  num('averageSessionLength', 'Average Session Length (min)', 'Behaviour', 'integer'),
  en('preferredChannel', 'Preferred Channel', 'Behaviour', CHANNEL_OPTS),
  str('favouriteGame', 'Favourite Game', 'Behaviour'),
  date('firstDepositAt', 'First Deposit Date', 'Behaviour'),
  date('lastDepositAt', 'Last Deposit Date', 'Behaviour'),
  date('lastBetAt', 'Last Bet Date', 'Behaviour'),
  date('lastLoginAt', 'Last Login Date', 'Behaviour'),
  // Real-time "Time Since" fields (derived; compare elapsed against a value+unit)
  date('timeSinceLastLogin', 'Time Since Last Login', 'Behaviour', 'Real-time recency.'),
  date('timeSinceLastDeposit', 'Time Since Last Deposit', 'Behaviour', 'Real-time recency.'),
  date('timeSinceLastBet', 'Time Since Last Bet', 'Behaviour', 'Real-time recency.'),
  date('timeSinceRegistration', 'Time Since Registration', 'Behaviour', 'Real-time tenure.'),

  // ---- Sportsbook -------------------------------------------------------
  num('sportsTotalStake', 'Sports - Total Stake', 'Sportsbook', 'currency'),
  num('sportsTotalBets', 'Sports - Total Bets', 'Sportsbook', 'integer'),
  num('sportsAverageStake', 'Sports - Average Stake', 'Sportsbook', 'currency'),
  num('sportsAverageOdds', 'Sports - Average Odds', 'Sportsbook'),
  num('sportsWinRate', 'Sports - Win Rate', 'Sportsbook', 'percent'),
  en('sportsPreferredBetType', 'Sports - Preferred Bet Type', 'Sportsbook', BET_TYPE_OPTS),
  str('sportsFavouriteSport', 'Sports - Favourite Sport', 'Sportsbook'),
  str('sportsFavouriteLeague', 'Sports - Favourite League', 'Sportsbook'),
  num('sportsLiveBetRatio', 'Sports - Live Bet Ratio', 'Sportsbook', 'ratio'),
  num('casinoTotalStake', 'Casino - Total Stake', 'Sportsbook', 'currency'),
  num('casinoTotalSpins', 'Casino - Total Spins', 'Sportsbook', 'integer'),
  num('casinoWinRate', 'Casino - Win Rate', 'Sportsbook', 'percent'),

  // ---- Bonuses ----------------------------------------------------------
  num('bonusesCreated', 'Bonuses Created', 'Bonuses', 'integer'),
  num('bonusesCompleted', 'Bonuses Completed', 'Bonuses', 'integer'),
  num('bonusesExpired', 'Bonuses Expired', 'Bonuses', 'integer'),
  num('bonusesForfeited', 'Bonuses Forfeited', 'Bonuses', 'integer'),
  num('bonusAmountGranted', 'Bonus Amount Granted', 'Bonuses', 'currency'),
  num('bonusAmountTurnedReal', 'Bonus Amount Turned Real', 'Bonuses', 'currency'),
  num('bonusCompletionRate', 'Bonus Completion Rate', 'Bonuses', 'percent'),
  num('bonusCostRatio', 'Bonus Cost Ratio', 'Bonuses', 'ratio'),
  bool('hasActiveBonus', 'Has Active Bonus', 'Bonuses'),
  date('lastBonusAt', 'Last Bonus Date', 'Bonuses'),

  // ---- Engagement -------------------------------------------------------
  en('stateOfEngagement', 'State of Engagement', 'Engagement', ENGAGEMENT_OPTS),
  num('engagementScore', 'Engagement Score', 'Engagement', 'integer'),
  num('loginStreak', 'Login Streak (days)', 'Engagement', 'integer'),
  num('daysActiveLast30', 'Days Active (last 30)', 'Engagement', 'integer'),
  num('healthScoreValue', 'Player Health Score', 'Engagement', 'integer'),

  // ---- Comms ------------------------------------------------------------
  num('emailsDelivered', 'Emails Delivered', 'Comms', 'integer'),
  num('emailsOpened', 'Emails Opened', 'Comms', 'integer'),
  num('emailsClicked', 'Emails Clicked', 'Comms', 'integer'),
  num('openToDeliveredRatio', 'Open-to-Delivered Ratio', 'Comms', 'ratio'),
  num('smsDelivered', 'SMS Delivered', 'Comms', 'integer'),
  num('pushDelivered', 'Push Delivered', 'Comms', 'integer'),
  bool('pushEnabled', 'Push Enabled', 'Comms'),
  date('lastContactedAt', 'Last Contacted Date', 'Comms'),

  // ---- Consent ----------------------------------------------------------
  bool('emailConsent', 'Email Consent', 'Consent'),
  bool('pushConsent', 'Push Consent', 'Consent'),
  bool('phoneConsent', 'Phone Consent', 'Consent'),
  en('accountStatus', 'Account Status', 'Consent', ACCOUNT_OPTS),

  // ---- Risk -------------------------------------------------------------
  num('abuseRiskScore', 'Abuse / Fraud Risk', 'Risk', 'integer'),
  num('depositToNgrRatio', 'Deposit to NGR Ratio', 'Risk', 'ratio'),
  bool('selfExcluded', 'Self-Excluded', 'Risk'),
  bool('rgFlagged', 'RG Flagged', 'Risk'),

  // ---- Player Features (states, ML predictions, derived attributes) -----
  en('acquisitionSource', 'Acquisition Source', 'Player Features', ACQUISITION_OPTS, 'How the player was acquired.'),
  en('activeState', 'Active State', 'Player Features', ACTIVE_STATE_OPTS, 'Idle / active bucket based on last activity.'),
  en('inactiveState', 'Inactive State', 'Player Features', INACTIVE_STATE_OPTS, 'Coarse inactivity window.'),
  en('conversionState', 'Conversion State', 'Player Features', CONVERSION_STATE_OPTS, 'Deposit funnel stage.'),
  en('lifestage', 'Lifestage', 'Player Features', LIFESTAGE_OPTS, 'Player maturity stage.'),
  en('mostActiveDay', 'Most Active Day of the Week', 'Player Features', DAY_OF_WEEK_OPTS),
  en('optimalTimeOfDay', 'Optimal Time of the Day', 'Player Features', OPTIMAL_TIME_OPTS, 'Best window to reach the player.'),
  en('playerOnlineState', 'Player Online State', 'Player Features', ONLINE_STATE_OPTS),
  en('mostCostEfficientChannel', 'Most Cost-Efficient Channel', 'Player Features', COST_EFFICIENT_CHANNEL_OPTS, 'Opted-in channel with best ROI.'),
  en('predictedDepositBracket', 'Predicted Deposit Bracket', 'Player Features', DEPOSIT_BRACKET_OPTS, 'AI-predicted deposit tier.'),
  en('preferredOfferType', 'Preferred Offer Type', 'Player Features', OFFER_TYPE_OPTS, 'AI-predicted best-fit offer.'),
  en('previouslyPlayedProduct', 'Previously Played Products', 'Player Features', PRODUCT_PLAYED_OPTS),
  num('changeInEngagement', 'Change in State of Engagement', 'Player Features', 'integer', 'Delta between yesterday and today (-6..6).'),
  en('engagementYesterday', 'State of Engagement Yesterday', 'Player Features', ENGAGEMENT_OPTS),
];

export const FIELD_DEFS: FieldDef[] = [
  { key: 'lifecycle', label: 'Lifecycle stage', type: 'enum', group: 'Profile', options: LIFECYCLE_OPTS, operators: ENUM_OPS },
  { key: 'country', label: 'Country', type: 'string', group: 'Profile', operators: ['eq', 'neq', 'contains'] },
  { key: 'primaryProduct', label: 'Primary product', type: 'enum', group: 'Profile', options: [
    { value: 'sportsbook', label: 'Sportsbook' }, { value: 'casino', label: 'Casino' }, { value: 'mixed', label: 'Mixed' },
  ], operators: ENUM_OPS },
  { key: 'kycStatus', label: 'KYC status', type: 'enum', group: 'Profile', options: [
    { value: 'verified', label: 'Verified' }, { value: 'pending', label: 'Pending' },
    { value: 'unverified', label: 'Unverified' }, { value: 'rejected', label: 'Rejected' },
  ], operators: ENUM_OPS },

  { key: 'rfmTier', label: 'RFM tier', type: 'enum', group: 'Value', options: [
    { value: 'Champion', label: 'Champion' }, { value: 'Loyal', label: 'Loyal' },
    { value: 'Potential', label: 'Potential' }, { value: 'At Risk', label: 'At Risk' },
    { value: 'Hibernating', label: 'Hibernating' },
  ], operators: ENUM_OPS },
  { key: 'rfmScore', label: 'RFM score (3–15)', type: 'number', group: 'Value', operators: NUM_OPS },
  { key: 'ltv', label: 'Lifetime value', type: 'number', group: 'Value', operators: NUM_OPS },

  { key: 'ngr', label: 'Net gaming revenue', type: 'number', group: 'Value', operators: NUM_OPS },
  { key: 'arpu', label: 'ARPU', type: 'number', group: 'Value', operators: NUM_OPS },
  { key: 'totalDeposits', label: 'Total deposits', type: 'number', group: 'Value', operators: NUM_OPS },
  { key: 'depositFrequency', label: 'Deposits / month', type: 'number', group: 'Behaviour', operators: NUM_OPS },
  { key: 'totalBets', label: 'Total bets', type: 'number', group: 'Behaviour', operators: NUM_OPS },
  { key: 'lastActiveAt', label: 'Last active', type: 'date', group: 'Behaviour', operators: DATE_OPS },
  { key: 'registeredAt', label: 'Registered', type: 'date', group: 'Behaviour', operators: DATE_OPS },

  { key: 'churnScore', label: 'Churn score', type: 'number', group: 'Risk', operators: NUM_OPS },
  { key: 'promoPropensity', label: 'Promo propensity', type: 'number', group: 'Risk', operators: NUM_OPS },
  { key: 'rgRisk', label: 'RG risk', type: 'number', group: 'Risk', operators: NUM_OPS },

  { key: 'marketingConsent', label: 'Marketing consent', type: 'boolean', group: 'Consent', operators: BOOL_OPS },
  { key: 'smsConsent', label: 'SMS consent', type: 'boolean', group: 'Consent', operators: BOOL_OPS },

  // ===================================================================
  // FT CRM extended attribute catalogue (Fast Track parity).
  // Values are derived deterministically per player — see enrichPlayer().
  // ===================================================================
  ...FT_CRM_FIELDS,
];

export function fieldDef(key: string): FieldDef | undefined {
  return FIELD_DEFS.find((f) => f.key === key);
}

// ---- RFM scoring ---------------------------------------------------------
// Recency / Frequency / Monetary — each scored 1..5 (quintile-style) so
// segments and the builder can target value tiers without raw-number tuning.

export interface RfmScore {
  recency: number;   // 1 (stale) .. 5 (very recent)
  frequency: number; // 1 (rare)  .. 5 (very frequent)
  monetary: number;  // 1 (low)   .. 5 (high value)
  score: number;     // 3..15 sum
  tier: 'Champion' | 'Loyal' | 'Potential' | 'At Risk' | 'Hibernating';
}

function scoreRecencyDays(days: number): number {
  if (days <= 3) return 5;
  if (days <= 7) return 4;
  if (days <= 14) return 3;
  if (days <= 30) return 2;
  return 1;
}

function scoreFrequency(depositsPerMonth: number): number {
  if (depositsPerMonth >= 20) return 5;
  if (depositsPerMonth >= 12) return 4;
  if (depositsPerMonth >= 6) return 3;
  if (depositsPerMonth >= 2) return 2;
  return 1;
}

function scoreMonetary(ltv: number): number {
  if (ltv >= 100000) return 5;
  if (ltv >= 50000) return 4;
  if (ltv >= 20000) return 3;
  if (ltv >= 5000) return 2;
  return 1;
}

function rfmTier(r: number, f: number, m: number): RfmScore['tier'] {
  const fm = (f + m) / 2;
  if (r >= 4 && fm >= 4) return 'Champion';
  if (r >= 3 && fm >= 3) return 'Loyal';
  if (r >= 3 && fm < 3) return 'Potential';
  if (r < 3 && fm >= 3) return 'At Risk';
  return 'Hibernating';
}

export function rfmScore(player: Player): RfmScore {
  const p = player as unknown as Record<string, unknown>;
  const recency = scoreRecencyDays(daysSince(String(p.lastActiveAt ?? new Date().toISOString())));
  const frequency = scoreFrequency(Number(p.depositFrequency ?? 0));
  const monetary = scoreMonetary(Number(p.ltv ?? 0));
  const score = recency + frequency + monetary;
  return { recency, frequency, monetary, score, tier: rfmTier(recency, frequency, monetary) };
}

export const OPERATOR_LABELS: Record<Operator, string> = {
  eq: 'equal', neq: 'not equal',
  is_null: 'is null', is_not_null: 'is not null',
  gt: 'greater', gte: 'greater or equal', lt: 'less', lte: 'less or equal',
  between: 'between', not_between: 'not between',
  begins_with: 'begins with', not_begins_with: "doesn't begin with",
  contains: 'contains', not_contains: "doesn't contain",
  is_empty: 'is empty', is_not_empty: 'is not empty',
};

// For date fields, comparison words read more naturally as elapsed-time bounds.
export const DATE_OPERATOR_LABELS: Partial<Record<Operator, string>> = {
  eq: 'exactly (ago)',
  lt: 'less than (ago)', lte: 'within the last',
  gt: 'more than (ago)', gte: 'at least (ago)',
  between: 'between (ago)', not_between: 'not between (ago)',
  is_null: 'is null', is_not_null: 'is not null',
};

export function operatorLabel(op: Operator, type?: FieldType): string {
  if (type === 'date' && DATE_OPERATOR_LABELS[op]) return DATE_OPERATOR_LABELS[op] as string;
  return OPERATOR_LABELS[op];
}


// ---- Evaluation ----------------------------------------------------------

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

// Elapsed time since a timestamp, expressed in the requested unit.
function elapsed(iso: string, unit: DateUnit = 'days'): number {
  const ms = Date.now() - new Date(iso).getTime();
  switch (unit) {
    case 'minutes': return ms / 60000;
    case 'hours': return ms / 3600000;
    case 'months': return ms / (86400000 * 30);
    case 'days':
    default: return ms / 86400000;
  }
}

function isBlank(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}


function derivedValue(player: Player, field: string): unknown {
  if (field === 'rfmTier') return rfmScore(player).tier;
  if (field === 'rfmScore') return rfmScore(player).score;
  // Real-time "Time Since" fields map onto the underlying timestamp so the
  // date-elapsed evaluation path can compare them against a value + unit.
  const p = player as unknown as Record<string, unknown>;
  switch (field) {
    case 'timeSinceLastLogin': return p.lastLoginAt ?? p.lastActiveAt;
    case 'timeSinceLastDeposit': return p.lastDepositAt ?? p.lastActiveAt;
    case 'timeSinceLastBet': return p.lastBetAt ?? p.lastActiveAt;
    case 'timeSinceRegistration': return p.registeredAt;
  }
  return (player as unknown as Record<string, unknown>)[field];
}

export function evalRule(player: Player, rule: Rule): boolean {
  const raw = derivedValue(player, rule.field);
  const def = fieldDef(rule.field);

  // Presence checks apply to every field type and ignore the value input.
  switch (rule.operator) {
    case 'is_null': return raw === null || raw === undefined;
    case 'is_not_null': return raw !== null && raw !== undefined;
    case 'is_empty': return isBlank(raw);
    case 'is_not_empty': return !isBlank(raw);
  }

  // Date fields compare elapsed time (in the rule's unit) since the timestamp.
  if (def?.type === 'date' && typeof raw === 'string') {
    const ago = elapsed(raw, rule.unit ?? 'days');
    const n = Number(rule.value);
    const n2 = Number(rule.value2);
    switch (rule.operator) {
      case 'eq': return Math.round(ago) === n;
      case 'lt': case 'lte': return ago <= n;
      case 'gt': case 'gte': return ago >= n;
      case 'between': return ago >= Math.min(n, n2) && ago <= Math.max(n, n2);
      case 'not_between': return ago < Math.min(n, n2) || ago > Math.max(n, n2);
      default: return false;
    }
  }

  const s = String(raw ?? '').toLowerCase();
  const v = String(rule.value ?? '').toLowerCase();

  switch (rule.operator) {
    case 'eq': return raw === rule.value;
    case 'neq': return raw !== rule.value;
    case 'gt': return Number(raw) > Number(rule.value);
    case 'gte': return Number(raw) >= Number(rule.value);
    case 'lt': return Number(raw) < Number(rule.value);
    case 'lte': return Number(raw) <= Number(rule.value);
    case 'between': {
      const n = Number(raw), lo = Number(rule.value), hi = Number(rule.value2);
      return n >= Math.min(lo, hi) && n <= Math.max(lo, hi);
    }
    case 'not_between': {
      const n = Number(raw), lo = Number(rule.value), hi = Number(rule.value2);
      return n < Math.min(lo, hi) || n > Math.max(lo, hi);
    }
    case 'contains': return s.includes(v);
    case 'not_contains': return !s.includes(v);
    case 'begins_with': return s.startsWith(v);
    case 'not_begins_with': return !s.startsWith(v);
    default: return false;
  }
}


export function matchPlayer(player: Player, segment: Segment): boolean {
  if (!segment.rules.length) return false;
  const results = segment.rules.map((r) => evalRule(player, r));
  return segment.match === 'all' ? results.every(Boolean) : results.some(Boolean);
}

export function segmentMembers(segment: Segment, players: Player[] = getPlayers()): Player[] {
  return players.filter((p) => matchPlayer(p, segment));
}

// ---- Persistence (localStorage-backed mock) ------------------------------

const SEG_KEY = 'crm_segments_v1';

export const PRESET_SEGMENTS: Segment[] = [
  {
    id: 'seg-high-value', name: 'High-Value Players', description: 'LTV over 100k — protect and reward.',
    match: 'all', preset: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    rules: [{ id: 'r1', field: 'ltv', operator: 'gte', value: 100000 }],
  },
  {
    id: 'seg-churn-risk', name: 'Churn Risk', description: 'High churn score and inactive 14+ days.',
    match: 'all', preset: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    rules: [
      { id: 'r1', field: 'churnScore', operator: 'gte', value: 60 },
      { id: 'r2', field: 'lastActiveAt', operator: 'gt', value: 14, unit: 'days' },

    ],
  },
  {
    id: 'seg-promo-ready', name: 'Promo-Ready', description: 'High propensity, opted in, low RG risk.',
    match: 'all', preset: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    rules: [
      { id: 'r1', field: 'promoPropensity', operator: 'gte', value: 65 },
      { id: 'r2', field: 'marketingConsent', operator: 'eq', value: true },
      { id: 'r3', field: 'rgRisk', operator: 'lt', value: 60 },
    ],
  },
  {
    id: 'seg-rfm-champions', name: 'RFM Champions', description: 'Recent, frequent, high-value players — your best cohort.',
    match: 'all', preset: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    rules: [{ id: 'r1', field: 'rfmTier', operator: 'eq', value: 'Champion' }],
  },
];


export function getSegments(): Segment[] {
  if (typeof window === 'undefined') return PRESET_SEGMENTS;
  const saved = JSON.parse(localStorage.getItem(SEG_KEY) || 'null');
  if (saved && Array.isArray(saved)) {
    // Ensure presets always present.
    const custom = (saved as Segment[]).filter((s) => !s.preset);
    return [...PRESET_SEGMENTS, ...custom];
  }
  return PRESET_SEGMENTS;
}

function persist(segments: Segment[]) {
  if (typeof window !== 'undefined') {
    const custom = segments.filter((s) => !s.preset);
    localStorage.setItem(SEG_KEY, JSON.stringify(custom));
  }
}

export function saveSegment(seg: Segment): Segment[] {
  const all = getSegments().filter((s) => s.id !== seg.id);
  const next = [...all, seg];
  persist(next);
  return getSegments();
}

export function deleteSegment(id: string): Segment[] {
  const next = getSegments().filter((s) => s.id !== id || s.preset);
  persist(next);
  return getSegments();
}

export function newSegmentDraft(): Segment {
  const now = new Date().toISOString();
  return {
    id: `seg-${Date.now()}`, name: '', match: 'all', rules: [],
    createdAt: now, updatedAt: now,
  };
}

export function newRule(field?: string): Rule {
  const def = (field ? fieldDef(field) : undefined) ?? FIELD_DEFS[0];
  const value = def.type === 'boolean' ? true : def.options?.[0]?.value ?? (def.type === 'number' || def.type === 'date' ? 0 : '');
  return { id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, field: def.key, operator: def.operators[0], value };
}

// Field groups in display order (for the grouped picker in the builder).
export const FIELD_GROUPS: FieldDef['group'][] = [
  'Profile', 'Contact', 'Value', 'Behaviour', 'Sportsbook',
  'Bonuses', 'Engagement', 'Comms', 'Risk', 'Consent', 'Player Features',
];

// Curated starting points shown when creating a new segment.
export interface SegmentTemplate {
  id: string;
  name: string;
  description: string;
  icon: 'crown' | 'alert' | 'gift' | 'sparkles' | 'moon' | 'blank';
  build: () => Pick<Segment, 'name' | 'description' | 'match' | 'rules'>;
}

export const SEGMENT_TEMPLATES: SegmentTemplate[] = [
  {
    id: 't-vip', name: 'VIP & high value', description: 'Top spenders by lifetime value to protect and reward.',
    icon: 'crown',
    build: () => ({ name: 'VIP & high value', description: 'LTV over 100k.', match: 'all',
      rules: [{ ...newRule('ltv'), operator: 'gte', value: 100000 }] }),
  },
  {
    id: 't-churn', name: 'Win-back candidates', description: 'High churn risk and inactive for two weeks.',
    icon: 'alert',
    build: () => ({ name: 'Win-back candidates', description: 'Churn 60+ and inactive 14+ days.', match: 'all',
      rules: [
        { ...newRule('churnScore'), operator: 'gte', value: 60 },
        { ...newRule('lastActiveAt'), operator: 'gt', value: 14, unit: 'days' },

      ] }),
  },
  {
    id: 't-promo', name: 'Promo-ready audience', description: 'Likely to convert, opted in, low RG risk.',
    icon: 'gift',
    build: () => ({ name: 'Promo-ready audience', description: 'Propensity 65+, consented, low risk.', match: 'all',
      rules: [
        { ...newRule('promoPropensity'), operator: 'gte', value: 65 },
        { ...newRule('marketingConsent'), operator: 'eq', value: true },
        { ...newRule('rgRisk'), operator: 'lt', value: 60 },
      ] }),
  },
  {
    id: 't-new', name: 'New player nurture', description: 'Recently registered players to onboard.',
    icon: 'sparkles',
    build: () => ({ name: 'New player nurture', description: 'Lifecycle: new.', match: 'all',
      rules: [{ ...newRule('lifecycle'), operator: 'eq', value: 'new' }] }),
  },
  {
    id: 't-dormant', name: 'Dormant reactivation', description: 'Players who have gone quiet for 30+ days.',
    icon: 'moon',
    build: () => ({ name: 'Dormant reactivation', description: 'Inactive 30+ days.', match: 'all',
      rules: [{ ...newRule('lastActiveAt'), operator: 'gt', value: 30, unit: 'days' }] }),

  },
  {
    id: 't-blank', name: 'Start from scratch', description: 'Build a custom audience rule by rule.',
    icon: 'blank',
    build: () => ({ name: '', description: '', match: 'all', rules: [newRule()] }),
  },
];


export type { PlayerLifecycle };
