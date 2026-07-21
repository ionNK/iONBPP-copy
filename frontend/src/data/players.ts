// Player Data Layer (CRM Phase 1 — Foundation)
// Players are INGESTED from the gaming platform. The CRM never creates players manually.
// This module is a mock/adapter layer: it simulates an event stream + nightly batch sync.
// Real integration (webhook + reconciliation job) will replace the seed source later.

export type PlayerLifecycle =
  | 'new'
  | 'active'
  | 'vip'
  | 'at_risk'
  | 'dormant'
  | 'churned'
  | 'reactivated';

export type KycStatus = 'verified' | 'pending' | 'unverified' | 'rejected';
export type AccountStatus = 'open' | 'suspended' | 'self_excluded' | 'closed';

export type ActivityType =
  | 'login'
  | 'deposit'
  | 'withdrawal'
  | 'bet'
  | 'win'
  | 'bonus'
  | 'session';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  label: string;
  amount?: number; // in player's currency, minor-agnostic display value
  timestamp: string; // ISO string
}

export interface BonusRecord {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'expired' | 'forfeited';
  value: number;
  wageringRemaining?: number; // percentage 0-100
  grantedAt: string;
}

export interface Player {
  // Identity (synced from platform — read-only)
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  registeredAt: string; // ISO
  kycStatus: KycStatus;
  accountStatus: AccountStatus;

  // Lifecycle / segmentation
  lifecycle: PlayerLifecycle;
  primaryProduct: 'sportsbook' | 'casino' | 'mixed';
  lastActiveAt: string; // ISO

  // Balances
  realBalance: number;
  bonusBalance: number;

  // Financial metrics
  ltv: number;
  ggr: number; // gross gaming revenue
  ngr: number; // net gaming revenue
  arpu: number;
  totalDeposits: number;
  totalWithdrawals: number;
  depositFrequency: number; // deposits / month
  bonusCostRatio: number; // 0-1

  // Gaming activity summary
  totalBets: number;
  totalSessions: number;
  favouriteGame: string;

  // Intelligence scores (surfaced from prediction modules — Phase 3 wires real values)
  churnScore: number; // 0-100
  promoPropensity: number; // 0-100
  rgRisk: number; // 0-100

  // RG / compliance
  rgFlags: string[];
  marketingConsent: boolean;
  smsConsent: boolean;

  // Feeds
  bonuses: BonusRecord[];
  timeline: ActivityEvent[];
}

const STORAGE_KEY = 'crm_players_v2';

// ---- FT CRM field enrichment ---------------------------------------------
// The segmentation catalogue (segments.ts → FT_CRM_FIELDS) exposes a wide,
// Fast Track-parity attribute set. Rather than store every attribute on the
// seed, we DERIVE them deterministically from a player's core metrics so that
// segment rules evaluate against realistic, self-consistent values. This is
// the mock stand-in for the platform's full profile projection.
function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function enrichPlayer(p: Player): Player {
  // If already enriched (has a derived marker) keep the core fields but
  // recompute derived ones so a stored snapshot never goes stale.
  const seed = hashSeed(p.id);
  const r = (n: number) => (seed % (n + 1));
  const [first = p.name.split(' ')[0], last = p.name.split(' ').slice(1).join(' ')] = p.name.split(' ');
  const depositCount = Math.max(1, Math.round(p.totalDeposits / Math.max(1, p.arpu || 1000)));
  const withdrawalCount = Math.max(0, Math.round(depositCount * 0.4));
  const derived = {
    // Contact
    firstName: first,
    lastName: last,
    title: ['Mr', 'Mrs', 'Ms', 'Dr'][r(3)],
    sex: (['M', 'F', 'O'] as const)[r(2)],
    address: `${100 + r(800)} Market St`,
    city: p.country,
    postalCode: String(10000 + r(89999)),
    language: 'English',
    currencyPref: p.currency,
    countryCode: p.country,
    mobileNumber: p.phone,
    affiliateReference: r(2) === 0 ? `AFF-${1000 + r(8999)}` : '',
    age: 21 + r(38),
    birthDate: new Date(Date.now() - (21 + r(38)) * 365 * 86400000).toISOString(),
    // Value
    valueTier: (['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] as const)[
      p.ltv >= 300000 ? 4 : p.ltv >= 100000 ? 3 : p.ltv >= 40000 ? 2 : p.ltv >= 10000 ? 1 : 0
    ],
    averageDepositAmount: Math.round(p.totalDeposits / depositCount),
    averageWithdrawalAmount: withdrawalCount ? Math.round(p.totalWithdrawals / withdrawalCount) : 0,
    depositCount,
    withdrawalCount,
    netDeposits: p.totalDeposits - p.totalWithdrawals,
    withdrawalToDepositRatio: p.totalDeposits ? +(p.totalWithdrawals / p.totalDeposits).toFixed(2) : 0,
    ggrBonusRatio: p.ggr ? +(p.bonusCostRatio).toFixed(2) : 0,
    // Behaviour
    averageSessionLength: 8 + r(42),
    preferredChannel: (['web', 'android', 'ios', 'ussd', 'retail'] as const)[r(4)],
    firstDepositAt: p.registeredAt,
    lastDepositAt: p.lastActiveAt,
    lastBetAt: p.lastActiveAt,
    lastLoginAt: p.lastActiveAt,
    // Sportsbook / casino
    sportsTotalStake: Math.round(p.totalDeposits * 0.7),
    sportsTotalBets: p.totalBets,
    sportsAverageStake: p.totalBets ? Math.round((p.totalDeposits * 0.7) / p.totalBets) : 0,
    sportsAverageOdds: +(1.5 + r(30) / 10).toFixed(2),
    sportsWinRate: 30 + r(30),
    sportsPreferredBetType: (['single', 'multi', 'system', 'live'] as const)[r(3)],
    sportsFavouriteSport: ['Football', 'Basketball', 'Tennis', 'Cricket'][r(3)],
    sportsFavouriteLeague: ['Premier League', 'La Liga', 'Serie A', 'NBA'][r(3)],
    sportsLiveBetRatio: +(r(100) / 100).toFixed(2),
    casinoTotalStake: Math.round(p.totalDeposits * 0.3),
    casinoTotalSpins: r(5000),
    casinoWinRate: 40 + r(15),
    // Bonuses
    bonusesCreated: p.bonuses.length + r(3),
    bonusesCompleted: p.bonuses.filter((b) => b.status === 'completed').length,
    bonusesExpired: p.bonuses.filter((b) => b.status === 'expired').length,
    bonusesForfeited: p.bonuses.filter((b) => b.status === 'forfeited').length,
    bonusAmountGranted: p.bonuses.reduce((s, b) => s + b.value, 0),
    bonusAmountTurnedReal: Math.round(p.bonuses.reduce((s, b) => s + b.value, 0) * 0.4),
    bonusCompletionRate: p.bonuses.length
      ? Math.round((p.bonuses.filter((b) => b.status === 'completed').length / p.bonuses.length) * 100)
      : 0,
    hasActiveBonus: p.bonuses.some((b) => b.status === 'active'),
    lastBonusAt: p.bonuses[0]?.grantedAt ?? p.registeredAt,
    // Engagement
    stateOfEngagement: (['Dead', 'Very Low', 'Low', 'Medium', 'High', 'Very High', 'Sky-High'] as const)[
      Math.min(6, Math.floor((100 - p.churnScore) / 15))
    ],
    engagementScore: 100 - p.churnScore,
    loginStreak: r(30),
    daysActiveLast30: r(30),
    healthScoreValue: healthScore(p),
    // Comms
    emailsDelivered: 20 + r(180),
    emailsOpened: 5 + r(80),
    emailsClicked: r(40),
    openToDeliveredRatio: +(0.2 + r(60) / 100).toFixed(2),
    smsDelivered: r(60),
    pushDelivered: r(120),
    pushEnabled: p.accountStatus === 'open' && p.marketingConsent,
    lastContactedAt: p.lastActiveAt,
    // Consent
    emailConsent: p.marketingConsent,
    pushConsent: p.marketingConsent,
    phoneConsent: p.smsConsent,
    // Risk
    abuseRiskScore: abuseRisk(p),
    depositToNgrRatio: p.ngr ? +(p.totalDeposits / p.ngr).toFixed(2) : 0,
    selfExcluded: p.accountStatus === 'self_excluded',
  };
  return { ...p, ...derived } as Player;
}

// ---- Seed dataset (simulates a batch sync snapshot from the platform) ----
export const SEED_PLAYERS: Player[] = [
  {
    id: 'PL-100241',
    name: 'Amara Njoroge',
    email: 'amara.n@example.com',
    phone: '+254 712 000 111',
    country: 'Kenya',
    currency: 'KES',
    registeredAt: '2023-02-14T09:12:00Z',
    kycStatus: 'verified',
    accountStatus: 'open',
    lifecycle: 'vip',
    primaryProduct: 'sportsbook',
    lastActiveAt: '2026-01-07T18:40:00Z',
    realBalance: 18400,
    bonusBalance: 2500,
    ltv: 128400,
    ggr: 96200,
    ngr: 71800,
    arpu: 5350,
    totalDeposits: 214000,
    totalWithdrawals: 118600,
    depositFrequency: 9,
    bonusCostRatio: 0.18,
    totalBets: 1842,
    totalSessions: 640,
    favouriteGame: 'Premier League Multibets',
    churnScore: 12,
    promoPropensity: 78,
    rgRisk: 22,
    rgFlags: [],
    marketingConsent: true,
    smsConsent: true,
    bonuses: [
      { id: 'B1', name: 'Acca Insurance', status: 'active', value: 2500, wageringRemaining: 40, grantedAt: '2026-01-05T10:00:00Z' },
      { id: 'B2', name: 'Weekend Cashback', status: 'completed', value: 1500, grantedAt: '2025-12-20T10:00:00Z' },
    ],
    timeline: [
      { id: 'E1', type: 'bonus', label: 'Claimed "Acca Insurance" bonus', amount: 2500, timestamp: '2026-01-07T16:40:00Z' },
      { id: 'E2', type: 'deposit', label: 'Deposit via M-Pesa', amount: 2000, timestamp: '2026-01-06T18:40:00Z' },
      { id: 'E3', type: 'bet', label: 'Placed sportsbook bet', amount: 800, timestamp: '2026-01-06T18:35:00Z' },
      { id: 'E4', type: 'win', label: 'Won multibet', amount: 5400, timestamp: '2026-01-05T21:10:00Z' },
      { id: 'E5', type: 'login', label: 'Logged in (iOS app)', timestamp: '2026-01-05T20:55:00Z' },
    ],
  },
  {
    id: 'PL-100258',
    name: 'Kwame Mensah', email: 'kwame.m@example.com', phone: '+233 244 555 222',
    country: 'Ghana', currency: 'GHS', registeredAt: '2024-06-01T11:00:00Z',
    kycStatus: 'verified', accountStatus: 'open', lifecycle: 'active', primaryProduct: 'casino',
    lastActiveAt: '2026-01-07T13:20:00Z',
    realBalance: 820, bonusBalance: 0, ltv: 42100, ggr: 31200, ngr: 24800, arpu: 1980,
    totalDeposits: 61000, totalWithdrawals: 33200, depositFrequency: 6, bonusCostRatio: 0.12,
    totalBets: 920, totalSessions: 410, favouriteGame: 'Aviator',
    churnScore: 34, promoPropensity: 61, rgRisk: 40, rgFlags: [], marketingConsent: true, smsConsent: false,
    bonuses: [{ id: 'B3', name: 'Casino Free Spins', status: 'active', value: 300, wageringRemaining: 65, grantedAt: '2026-01-04T10:00:00Z' }],
    timeline: [
      { id: 'K1', type: 'session', label: 'Casino session (32m)', timestamp: '2026-01-07T13:20:00Z' },
      { id: 'K2', type: 'bet', label: 'Placed Aviator bet', amount: 50, timestamp: '2026-01-07T13:05:00Z' },
      { id: 'K3', type: 'deposit', label: 'Deposit via MTN MoMo', amount: 200, timestamp: '2026-01-06T09:10:00Z' },
    ],
  },
  {
    id: 'PL-100263',
    name: 'Fatima Hassan', email: 'fatima.h@example.com', phone: '+255 754 333 999',
    country: 'Tanzania', currency: 'TZS', registeredAt: '2025-11-20T08:30:00Z',
    kycStatus: 'pending', accountStatus: 'open', lifecycle: 'at_risk', primaryProduct: 'sportsbook',
    lastActiveAt: '2025-12-29T10:00:00Z',
    realBalance: 12000, bonusBalance: 5000, ltv: 310000, ggr: 180000, ngr: 120000, arpu: 26000,
    totalDeposits: 520000, totalWithdrawals: 210000, depositFrequency: 3, bonusCostRatio: 0.31,
    totalBets: 340, totalSessions: 96, favouriteGame: 'La Liga Singles',
    churnScore: 71, promoPropensity: 44, rgRisk: 58, rgFlags: ['Rapid deposit pattern'], marketingConsent: false, smsConsent: true,
    bonuses: [{ id: 'B4', name: 'Welcome Bonus', status: 'active', value: 5000, wageringRemaining: 80, grantedAt: '2025-11-20T08:35:00Z' }],
    timeline: [
      { id: 'F1', type: 'login', label: 'Logged in (web)', timestamp: '2025-12-29T10:00:00Z' },
      { id: 'F2', type: 'withdrawal', label: 'Withdrawal request', amount: 40000, timestamp: '2025-12-28T15:20:00Z' },
    ],
  },
  {
    id: 'PL-100277',
    name: 'Brian Otieno', email: 'brian.o@example.com', phone: '+254 733 121 212',
    country: 'Kenya', currency: 'KES', registeredAt: '2025-12-28T16:45:00Z',
    kycStatus: 'unverified', accountStatus: 'open', lifecycle: 'new', primaryProduct: 'mixed',
    lastActiveAt: '2026-01-07T19:05:00Z',
    realBalance: 500, bonusBalance: 1000, ltv: 2300, ggr: 1400, ngr: 900, arpu: 460,
    totalDeposits: 3000, totalWithdrawals: 0, depositFrequency: 4, bonusCostRatio: 0.43,
    totalBets: 22, totalSessions: 14, favouriteGame: 'Live Football',
    churnScore: 25, promoPropensity: 88, rgRisk: 18, rgFlags: [], marketingConsent: true, smsConsent: true,
    bonuses: [{ id: 'B5', name: 'First Deposit Match', status: 'active', value: 1000, wageringRemaining: 90, grantedAt: '2025-12-28T16:50:00Z' }],
    timeline: [
      { id: 'BR1', type: 'bet', label: 'Placed first bet', amount: 100, timestamp: '2026-01-07T19:05:00Z' },
      { id: 'BR2', type: 'login', label: 'Registered account', timestamp: '2025-12-28T16:45:00Z' },
    ],
  },
  {
    id: 'PL-100290',
    name: 'Grace Abeba', email: 'grace.a@example.com', phone: '+251 911 456 456',
    country: 'Ethiopia', currency: 'ETB', registeredAt: '2022-08-10T07:00:00Z',
    kycStatus: 'verified', accountStatus: 'self_excluded', lifecycle: 'churned', primaryProduct: 'casino',
    lastActiveAt: '2025-12-06T12:00:00Z',
    realBalance: 0, bonusBalance: 0, ltv: 540200, ggr: 402000, ngr: 288000, arpu: 12200,
    totalDeposits: 890000, totalWithdrawals: 640000, depositFrequency: 0, bonusCostRatio: 0.22,
    totalBets: 5210, totalSessions: 2100, favouriteGame: 'Roulette',
    churnScore: 96, promoPropensity: 20, rgRisk: 82, rgFlags: ['Self-exclusion active', 'High loss velocity'], marketingConsent: false, smsConsent: false,
    bonuses: [{ id: 'B6', name: 'VIP Reload', status: 'expired', value: 8000, grantedAt: '2025-10-01T10:00:00Z' }],
    timeline: [
      { id: 'G1', type: 'session', label: 'Self-exclusion enabled', timestamp: '2025-12-06T12:00:00Z' },
    ],
  },
  {
    id: 'PL-100305',
    name: 'Samuel Kiprop', email: 'samuel.k@example.com', phone: '+254 701 909 909',
    country: 'Kenya', currency: 'KES', registeredAt: '2024-01-15T10:00:00Z',
    kycStatus: 'verified', accountStatus: 'open', lifecycle: 'reactivated', primaryProduct: 'casino',
    lastActiveAt: '2026-01-06T22:10:00Z',
    realBalance: 3300, bonusBalance: 750, ltv: 21300, ggr: 15400, ngr: 11200, arpu: 890,
    totalDeposits: 44000, totalWithdrawals: 26000, depositFrequency: 5, bonusCostRatio: 0.19,
    totalBets: 610, totalSessions: 320, favouriteGame: 'Blackjack',
    churnScore: 41, promoPropensity: 72, rgRisk: 30, rgFlags: [], marketingConsent: true, smsConsent: true,
    bonuses: [{ id: 'B7', name: 'Winback Offer', status: 'completed', value: 750, grantedAt: '2026-01-02T10:00:00Z' }],
    timeline: [
      { id: 'S1', type: 'deposit', label: 'Deposit via M-Pesa', amount: 500, timestamp: '2026-01-06T22:10:00Z' },
      { id: 'S2', type: 'bonus', label: 'Redeemed winback offer', amount: 750, timestamp: '2026-01-02T10:05:00Z' },
    ],
  },
  {
    id: 'PL-100318',
    name: 'Zainab Bello', email: 'zainab.b@example.com', phone: '+234 803 777 000',
    country: 'Nigeria', currency: 'NGN', registeredAt: '2023-09-05T14:20:00Z',
    kycStatus: 'verified', accountStatus: 'open', lifecycle: 'dormant', primaryProduct: 'sportsbook',
    lastActiveAt: '2025-11-15T09:00:00Z',
    realBalance: 6200, bonusBalance: 0, ltv: 88700, ngr: 52000, ggr: 70000, arpu: 3100,
    totalDeposits: 150000, totalWithdrawals: 92000, depositFrequency: 1, bonusCostRatio: 0.15,
    totalBets: 1120, totalSessions: 480, favouriteGame: 'UCL Accumulators',
    churnScore: 63, promoPropensity: 55, rgRisk: 27, rgFlags: [], marketingConsent: true, smsConsent: false,
    bonuses: [],
    timeline: [
      { id: 'Z1', type: 'login', label: 'Last login (web)', timestamp: '2025-11-15T09:00:00Z' },
    ],
  },
];

// ---- Sync adapter API ----------------------------------------------------

/**
 * Returns the current synced player snapshot. On first run it "ingests" the
 * seed batch. This stands in for a real platform sync/reconciliation job.
 */
export function getPlayers(): Player[] {
  if (typeof window === 'undefined') return SEED_PLAYERS;
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (saved && Array.isArray(saved) && saved.length) return (saved as Player[]).map(enrichPlayer);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PLAYERS));
  return SEED_PLAYERS.map(enrichPlayer);
}

/** Look up a single synced player by platform id. */
export function getPlayer(id: string): Player | null {
  return getPlayers().find((p) => p.id === id) || null;
}

/**
 * Simulates a platform re-sync (batch reconciliation). In production this would
 * pull the latest snapshot from the gaming platform; here it merges freshly
 * "ingested" event-stream activity into each player's timeline and refreshes the
 * lastSynced timestamp. The current snapshot (not the raw seed) is used as the
 * base so activity accumulates across syncs.
 */
export function resyncPlayers(): { players: Player[]; syncedAt: string; newEvents: number } {
  const syncedAt = new Date().toISOString();
  const base = getPlayers();
  let newEvents = 0;
  const refreshed = base.map((p) => {
    const before = p.timeline.length;
    const updated = applyStreamToPlayer(p);
    newEvents += updated.timeline.length - before;
    // Bump lastActiveAt to the newest event if the player had activity this sync.
    const latest = updated.timeline[0]?.timestamp;
    return latest && new Date(latest) > new Date(p.lastActiveAt)
      ? { ...updated, lastActiveAt: latest }
      : updated;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
    localStorage.setItem('crm_players_last_sync', syncedAt);
  }
  return { players: refreshed, syncedAt, newEvents };
}

export function getLastSync(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('crm_players_last_sync');
}

// ---- Presentation helpers ------------------------------------------------

export function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Aggregate lifecycle distribution across the synced base. */
export function lifecycleBreakdown(players: Player[] = getPlayers()): Record<PlayerLifecycle, number> {
  const base = { new: 0, active: 0, vip: 0, at_risk: 0, dormant: 0, churned: 0, reactivated: 0 } as Record<PlayerLifecycle, number>;
  players.forEach((p) => { base[p.lifecycle] += 1; });
  return base;
}

/** Risk band bucketing helper for intelligence/RG views. */
export function riskBand(score: number): { label: 'Low' | 'Medium' | 'High'; color: string } {
  if (score >= 66) return { label: 'High', color: '#f87171' };
  if (score >= 33) return { label: 'Medium', color: '#fb923c' };
  return { label: 'Low', color: '#699951' };
}

/**
 * Composite "Player Health Score" (0-100). Blends engagement/value signals
 * with risk signals. High promo propensity + low churn/RG risk => healthy.
 * This mirrors the single-score summaries used by Fast Track / Optimove.
 */
export function healthScore(p: Player): number {
  const value = Math.min(100, (p.promoPropensity + (100 - p.churnScore)) / 2);
  const risk = (p.churnScore + p.rgRisk) / 2;
  const score = Math.round(value * 0.65 + (100 - risk) * 0.35);
  return Math.max(0, Math.min(100, score));
}

export function healthBand(score: number): { label: 'Poor' | 'Fair' | 'Good' | 'Excellent'; color: string } {
  if (score >= 80) return { label: 'Excellent', color: '#699951' };
  if (score >= 60) return { label: 'Good', color: '#84cc16' };
  if (score >= 40) return { label: 'Fair', color: '#fb923c' };
  return { label: 'Poor', color: '#f87171' };
}

/**
 * Predicted future value (next 12 months) — a lightweight forecast derived
 * from ARPU, deposit cadence and churn. Stands in for Optimove-style
 * predictive LTV until the ML pipeline feeds real values.
 */
export function predictedValue(p: Player): number {
  const monthlyBase = p.arpu * Math.max(0.25, p.depositFrequency / 6);
  const retention = 1 - p.churnScore / 100;
  return Math.round(monthlyBase * 12 * retention);
}

/**
 * Bonus-abuse / fraud risk score (0-100). A heuristic that blends bonus
 * reliance, withdraw-to-deposit velocity and low genuine engagement — the
 * classic bonus-hunter signature. Stands in for a fraud model until the ML
 * pipeline feeds real values (Phase 3 intelligence).
 */
export function abuseRisk(p: Player): number {
  // High bonus cost relative to real play.
  const bonusReliance = Math.min(1, p.bonusCostRatio / 0.45);
  // Cashes out quickly relative to what they deposit.
  const cashoutVelocity = p.totalDeposits > 0
    ? Math.min(1, p.totalWithdrawals / p.totalDeposits)
    : 0;
  // Thin genuine engagement (few sessions per bet placed).
  const thinEngagement = p.totalBets > 0
    ? Math.min(1, 1 - Math.min(1, p.totalSessions / Math.max(1, p.totalBets)))
    : 0;
  const raw = bonusReliance * 0.5 + cashoutVelocity * 0.3 + thinEngagement * 0.2;
  return Math.round(Math.max(0, Math.min(100, raw * 100)));
}


export type ChannelKey = 'email' | 'sms' | 'push';
export interface Reachability { key: ChannelKey; label: string; reachable: boolean; detail: string }

/** Channel reachability panel (Xtremepush / OneSignal style). */
export function reachability(p: Player): Reachability[] {
  return [
    { key: 'email', label: 'Email', reachable: p.marketingConsent, detail: p.marketingConsent ? 'Opted in' : 'No consent' },
    { key: 'sms', label: 'SMS', reachable: p.smsConsent, detail: p.smsConsent ? 'Opted in' : 'No consent' },
    { key: 'push', label: 'Push', reachable: p.accountStatus === 'open' && p.marketingConsent, detail: p.accountStatus === 'open' && p.marketingConsent ? 'App token active' : 'Unavailable' },
  ];
}

/** Rule-based "Next Best Action" recommendation (pre-ML heuristic). */
export function nextBestAction(p: Player): { title: string; reason: string; cta: string } {
  if (p.accountStatus === 'self_excluded' || p.rgRisk >= 75) {
    return { title: 'Responsible Gaming review', reason: 'High RG risk / self-exclusion active — suppress marketing and review.', cta: 'Open RG Review' };
  }
  if (p.churnScore >= 65) {
    return { title: 'Trigger win-back journey', reason: `Churn risk is high (${p.churnScore}/100) with declining activity.`, cta: 'Send Win-back Offer' };
  }
  if (p.lifecycle === 'new') {
    return { title: 'Onboarding nudge', reason: 'New player — reinforce first-deposit habit while propensity is high.', cta: 'Send Onboarding Offer' };
  }
  if (p.lifecycle === 'vip' || p.ltv > 100000) {
    return { title: 'VIP retention gesture', reason: 'High-value player — protect LTV with a personalised reward.', cta: 'Grant VIP Bonus' };
  }
  if (p.promoPropensity >= 65) {
    return { title: 'Cross-sell promotion', reason: `Strong promo propensity (${p.promoPropensity}/100).`, cta: 'Target with Promotion' };
  }
  return { title: 'Maintain engagement', reason: 'Player is stable — keep in standard lifecycle journey.', cta: 'View Journeys' };
}

/** Peers in the same lifecycle segment (excludes self). */
export function similarPlayers(p: Player, limit = 4): Player[] {
  return getPlayers()
    .filter((x) => x.id !== p.id && x.lifecycle === p.lifecycle)
    .slice(0, limit);
}

// ---- Event stream simulator (Phase 1 ingestion layer) ------------------------
//
// The platform feeds events via webhook (real-time) + batch reconciliation (nightly).
// This module is the mock adapter layer: it generates plausible new events that
// "arrive" each time a player syncs — giving the timeline a live feel without a live
// gaming platform backend. Real integration replaces this later.

export interface PlayerNote {
  id: string;
  text: string;
  author: string;
  kind: 'note' | 'action';
  createdAt: string;
}

const NOTES_KEY = 'crm_player_notes_v1';

function readNotes(): Record<string, PlayerNote[]> {
  if (typeof window === 'undefined') return {};
  return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
}

function writeNotes(all: Record<string, PlayerNote[]>) {
  if (typeof window !== 'undefined') localStorage.setItem(NOTES_KEY, JSON.stringify(all));
}

export function getPlayerNotes(id: string): PlayerNote[] {
  return readNotes()[id] || [];
}

export function addPlayerNote(id: string, text: string, kind: 'note' | 'action' = 'note', author = 'Operator'): PlayerNote[] {
  const all = readNotes();
  const note: PlayerNote = { id: `N-${Date.now()}`, text, author, kind, createdAt: new Date().toISOString() };
  all[id] = [note, ...(all[id] || [])];
  writeNotes(all);
  return all[id];
}

/** Fresh events that will be appended to each player's timeline on re-sync. */
function generateStreamEvents(player: Player): ActivityEvent[] {
  const now = Date.now();
  const rng = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const stream: ActivityEvent[] = [];

  // Platform "heartbeat" login (most players log in on session)
  const minsAgo = rng(0, 15);
  stream.push({
    id: `S-${player.id}-LOGIN-${now}`,
    type: 'login',
    label: pick(['Logged in (iOS app)', 'Logged in (Android app)', 'Logged in (web)', 'Logged in (mobile web)']),
    timestamp: new Date(now - minsAgo * 60000).toISOString(),
  });

  // Sportsbook players place bets
  if (player.primaryProduct === 'sportsbook' || player.primaryProduct === 'mixed') {
    if (rng(0, 9) < 7) {
      const betAmt = rng(50, 2000);
      stream.push({
        id: `S-${player.id}-BET-${now}`,
        type: 'bet',
        label: pick(['Placed sportsbook bet', 'Placed multibet', 'Placed live bet']),
        amount: betAmt,
        timestamp: new Date(now - rng(2, minsAgo + 5) * 60000).toISOString(),
      });
      // Occasional win
      if (rng(0, 9) < 3) {
        const winAmt = Math.round(betAmt * rng(10, 30) / 10);
        stream.push({
          id: `S-${player.id}-WIN-${now}`,
          type: 'win',
          label: pick(['Won bet', 'Won accumulator', 'Won multibet payout']),
          amount: winAmt,
          timestamp: new Date(now - rng(1, 3) * 60000).toISOString(),
        });
      }
    }
  }

  // Casino players spin / play
  if (player.primaryProduct === 'casino' || player.primaryProduct === 'mixed') {
    if (rng(0, 9) < 6) {
      const betAmt = rng(20, 500);
      stream.push({
        id: `S-${player.id}-SESSION-${now}`,
        type: 'session',
        label: pick(['Casino session', 'Slot session', 'Roulette session', 'Live casino session']),
        amount: betAmt,
        timestamp: new Date(now - rng(3, minsAgo + 8) * 60000).toISOString(),
      });
    }
  }

  // Dormant / at-risk / churned players are quiet (no stream events — they already have stale timelines)
  if (['dormant', 'churned', 'self_excluded'].includes(player.lifecycle)) return [];

  // Occasionally a deposit event fires
  if (rng(0, 9) < 4 && player.accountStatus === 'open') {
    const depAmt = rng(100, 5000);
    stream.push({
      id: `S-${player.id}-DEP-${now}`,
      type: 'deposit',
      label: pick(['Deposit via M-Pesa', 'Deposit via MTN MoMo', 'Deposit via Airtel Money', 'Deposit via bank card']),
      amount: depAmt,
      timestamp: new Date(now - rng(10, 60) * 60000).toISOString(),
    });
  }

  // Sort by timestamp descending (most recent first)
  return stream.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Merges newly generated stream events into the player's timeline, deduplicates
 * by event id, and returns the updated player snapshot. Called on every sync.
 */
export function applyStreamToPlayer(player: Player): Player {
  const newEvents = generateStreamEvents(player);
  const existingIds = new Set(player.timeline.map((e) => e.id));
  const merged = [...newEvents.filter((e) => !existingIds.has(e.id)), ...player.timeline];
  return { ...player, timeline: merged };
}

export const LIFECYCLE_META: Record<PlayerLifecycle, { label: string; color: string; bg: string }> = {


  new: { label: 'New', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.18)' },
  active: { label: 'Active', color: '#699951', bg: 'rgba(105, 153, 81, 0.2)' },
  vip: { label: 'VIP', color: '#F2D641', bg: 'rgba(242, 214, 65, 0.2)' },
  at_risk: { label: 'At Risk', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.2)' },
  dormant: { label: 'Dormant', color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.2)' },
  churned: { label: 'Churned', color: '#f87171', bg: 'rgba(248, 113, 113, 0.2)' },
  reactivated: { label: 'Reactivated', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)' },
};
