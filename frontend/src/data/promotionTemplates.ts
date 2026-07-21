// Template metadata: single source of truth for the 8 Day-1 promotion templates.
// Drives conditional configurator fields shown in the wizard (Step 1 -> downstream steps).

export type FieldKey =
  | 'depositMatchPercent'
  | 'maxBonus'
  | 'minDeposit'
  | 'wageringMultiplier'
  | 'minOdds'
  | 'freeBetAmount'
  | 'freeRounds'
  | 'cashbackPercent'
  | 'cashbackCap'
  | 'accaMinLegs'
  | 'awardReason'
  | 'expiryDays';

export interface TemplateMeta {
  id: string;
  purpose: string;
  trigger: string;
  allowedRewards: string[];
  journey: string;
  // Fields the configurator should render for this template.
  fields: FieldKey[];
  // Subset of `fields` that are mandatory before the step can be completed.
  requiredFields: FieldKey[];
}

export const TEMPLATE_META: Record<string, TemplateMeta> = {
  welcome_bonus: {
    id: 'welcome_bonus',
    purpose: 'Acquire & activate new customers.',
    trigger: 'First deposit by a newly registered customer.',
    allowedRewards: ['Deposit Match Bonus', 'Free Bet'],
    journey: 'Register → First deposit → Bonus credited → Wager to release.',
    fields: ['depositMatchPercent', 'maxBonus', 'minDeposit', 'wageringMultiplier', 'minOdds', 'expiryDays'],
    requiredFields: ['depositMatchPercent', 'maxBonus', 'minDeposit', 'wageringMultiplier'],
  },
  deposit_match: {
    id: 'deposit_match',
    purpose: 'Match a percentage of a deposit to boost balances.',
    trigger: 'Qualifying deposit within the campaign window.',
    allowedRewards: ['Deposit Match Bonus'],
    journey: 'Deposit → Match calculated → Bonus credited → Wager to release.',
    fields: ['depositMatchPercent', 'maxBonus', 'minDeposit', 'wageringMultiplier', 'expiryDays'],
    requiredFields: ['depositMatchPercent', 'maxBonus', 'minDeposit', 'wageringMultiplier'],
  },
  bet_get: {
    id: 'bet_get',
    purpose: 'Place a qualifying bet, get a free bet or bonus.',
    trigger: 'Settlement of a qualifying bet at minimum odds.',
    allowedRewards: ['Free Bet', 'Bonus Funds'],
    journey: 'Place qualifying bet → Bet settles → Free bet awarded.',
    fields: ['minDeposit', 'minOdds', 'freeBetAmount', 'wageringMultiplier', 'expiryDays'],
    requiredFields: ['minOdds', 'freeBetAmount'],
  },
  free_bets: {
    id: 'free_bets',
    purpose: 'Issue free bets to qualifying customers.',
    trigger: 'Manual or segment-based issuance.',
    allowedRewards: ['Free Bet'],
    journey: 'Qualify → Free bet issued → Use before expiry → Winnings (ex-stake).',
    fields: ['freeBetAmount', 'minOdds', 'expiryDays'],
    requiredFields: ['freeBetAmount'],
  },
  aviator_free_rounds: {
    id: 'aviator_free_rounds',
    purpose: 'Drop free rounds to active Aviator players.',
    trigger: 'Segment membership or activity threshold.',
    allowedRewards: ['Free Rounds'],
    journey: 'Qualify → Free rounds credited → Play → Winnings to bonus.',
    fields: ['freeRounds', 'wageringMultiplier', 'expiryDays'],
    requiredFields: ['freeRounds'],
  },
  cashback: {
    id: 'cashback',
    purpose: 'Return part of losses or stake as bonus.',
    trigger: 'Net loss over the campaign period.',
    allowedRewards: ['Cashback Bonus'],
    journey: 'Play over period → Net loss computed → Cashback credited.',
    fields: ['cashbackPercent', 'cashbackCap', 'wageringMultiplier', 'expiryDays'],
    requiredFields: ['cashbackPercent', 'cashbackCap'],
  },
  acca_insurance: {
    id: 'acca_insurance',
    purpose: 'Refund an acca when one leg fails.',
    trigger: 'Accumulator with one losing leg at minimum legs.',
    allowedRewards: ['Free Bet', 'Bonus Funds'],
    journey: 'Place acca → One leg loses → Stake refunded as free bet.',
    fields: ['accaMinLegs', 'minOdds', 'freeBetAmount', 'maxBonus', 'expiryDays'],
    requiredFields: ['accaMinLegs', 'maxBonus'],
  },
  manual_bulk: {
    id: 'manual_bulk',
    purpose: 'Grant goodwill, VIP or correction rewards.',
    trigger: 'Manual issuance by an operator.',
    allowedRewards: ['Bonus Funds', 'Free Bet', 'Cash'],
    journey: 'Select customers → Choose reward → Award reason → Credit.',
    fields: ['freeBetAmount', 'awardReason', 'expiryDays'],
    requiredFields: ['awardReason'],
  },
};

export function getTemplateMeta(id: string): TemplateMeta | undefined {
  return TEMPLATE_META[id];
}

// Human-readable labels for each configurable field, used in validation messages.
export const FIELD_LABELS: Record<FieldKey, string> = {
  depositMatchPercent: 'Deposit Match %',
  maxBonus: 'Max Bonus / Cap',
  minDeposit: 'Minimum Deposit',
  wageringMultiplier: 'Wagering Multiplier',
  minOdds: 'Minimum Odds',
  freeBetAmount: 'Free Bet Amount',
  freeRounds: 'Free Rounds',
  cashbackPercent: 'Cashback %',
  cashbackCap: 'Cashback Cap',
  accaMinLegs: 'Acca Minimum Legs',
  awardReason: 'Award Reason',
  expiryDays: 'Expiry (days)',
};

// A minimal view of wizard reward state that the validator needs to inspect.
export interface RewardValidationInput {
  simpleConfig: { percentage: string; cap: string };
  wagering: number;
  freebet: { unitValue: string; maxTotalCap: string; expiryHours: string };
  awardReason?: string;
}

const isFilled = (v: unknown): boolean => {
  if (v === undefined || v === null) return false;
  const s = String(v).trim();
  if (s === '') return false;
  // Numeric strings must be non-zero; free-text (e.g. award reason) just needs content.
  const n = Number(s);
  return isNaN(n) ? true : n !== 0;
};


// Resolves whether a given template FieldKey has a usable value in the reward state.
function fieldHasValue(field: FieldKey, r: RewardValidationInput): boolean {
  switch (field) {
    case 'depositMatchPercent':
    case 'cashbackPercent':
      return isFilled(r.simpleConfig.percentage);
    case 'maxBonus':
    case 'cashbackCap':
      return isFilled(r.simpleConfig.cap);
    case 'wageringMultiplier':
      return r.wagering > 0;
    case 'freeBetAmount':
      return isFilled(r.freebet.unitValue);
    case 'freeRounds':
      return isFilled(r.freebet.maxTotalCap);
    case 'expiryDays':
      return isFilled(r.freebet.expiryHours);
    case 'awardReason':
      return isFilled(r.awardReason);
    // Fields configured in other steps (odds, legs, deposit) are not blocked here.
    case 'minOdds':
    case 'minDeposit':
    case 'accaMinLegs':
      return true;
    default:
      return true;
  }
}

// Returns the labels of any required fields that are still missing for the template.
export function getMissingRequiredFields(
  templateId: string,
  reward: RewardValidationInput,
): string[] {
  const meta = getTemplateMeta(templateId);
  if (!meta) return [];
  return meta.requiredFields
    .filter((field) => !fieldHasValue(field, reward))
    .map((field) => FIELD_LABELS[field]);
}


