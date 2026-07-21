// Responsible Gaming (RG) engine — derives risk signals, recommended
// interventions and a persistent case log from the synced player base.
// Mirrors safer-gambling consoles (Mindway / Playtech BetBuddy style):
// detect markers -> triage into a case -> log the operator action.

import { Player } from './players';

export type RgTier = 'critical' | 'high' | 'monitor' | 'healthy';

export interface RgSignal {
  key: string;
  label: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
}

export interface RgCase {
  player: Player;
  tier: RgTier;
  signals: RgSignal[];
  recommended: RgActionKey;
}

export type RgActionKey =
  | 'freeze'
  | 'deposit_limit'
  | 'cool_off'
  | 'welfare_check'
  | 'monitor'
  | 'clear';

export const RG_ACTIONS: Record<RgActionKey, { label: string; description: string; tone: 'danger' | 'warn' | 'ok' }> = {
  freeze: { label: 'Freeze Account', description: 'Suspend deposits & wagering pending review', tone: 'danger' },
  deposit_limit: { label: 'Apply Deposit Limit', description: 'Enforce a mandatory deposit cap', tone: 'warn' },
  cool_off: { label: 'Trigger Cool-off', description: 'Enforce a 24h+ cooling-off period', tone: 'warn' },
  welfare_check: { label: 'Welfare Contact', description: 'Reach out with safer-gambling resources', tone: 'warn' },
  monitor: { label: 'Add to Watchlist', description: 'Continue monitoring, no action yet', tone: 'ok' },
  clear: { label: 'Mark Reviewed', description: 'No concern — clear from queue', tone: 'ok' },
};

export function tierOf(score: number, accountStatus: string): RgTier {
  if (accountStatus === 'self_excluded' || score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 40) return 'monitor';
  return 'healthy';
}

export const TIER_META: Record<RgTier, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#f87171' },
  high: { label: 'High', color: '#fb923c' },
  monitor: { label: 'Monitor', color: '#eab308' },
  healthy: { label: 'Healthy', color: '#699951' },
};

/** Derive behavioural RG markers for a player. */
export function signalsFor(p: Player): RgSignal[] {
  const out: RgSignal[] = [];
  if (p.accountStatus === 'self_excluded') {
    out.push({ key: 'self_excl', label: 'Self-exclusion active', detail: 'Player has self-excluded — all marketing must stay suppressed.', severity: 'high' });
  }
  (p.rgFlags || []).forEach((f, i) =>
    out.push({ key: `flag-${i}`, label: f, detail: 'Platform-raised marker.', severity: 'high' }),
  );
  if (p.depositFrequency >= 8) {
    out.push({ key: 'freq', label: 'High deposit frequency', detail: `${p.depositFrequency} deposits/month — above safe cadence.`, severity: 'medium' });
  }
  const lossRatio = p.totalDeposits > 0 ? (p.totalDeposits - p.totalWithdrawals) / p.totalDeposits : 0;
  if (lossRatio >= 0.5 && p.totalDeposits > 50000) {
    out.push({ key: 'loss', label: 'High net loss', detail: `${Math.round(lossRatio * 100)}% of deposits retained as losses.`, severity: 'medium' });
  }
  if (p.totalSessions > 0 && p.totalBets / p.totalSessions > 4) {
    out.push({ key: 'intensity', label: 'High play intensity', detail: `${(p.totalBets / p.totalSessions).toFixed(1)} bets per session.`, severity: 'low' });
  }
  if (p.bonusCostRatio >= 0.35) {
    out.push({ key: 'chasing', label: 'Bonus-driven play', detail: 'Elevated bonus reliance can mask loss-chasing.', severity: 'low' });
  }
  return out;
}

export function recommendAction(p: Player, tier: RgTier): RgActionKey {
  if (p.accountStatus === 'self_excluded') return 'freeze';
  if (tier === 'critical') return 'freeze';
  if (tier === 'high') return p.depositFrequency >= 8 ? 'deposit_limit' : 'welfare_check';
  if (tier === 'monitor') return 'monitor';
  return 'clear';
}

/** Build the triaged RG case list (flagged players only), most severe first. */
export function buildCases(players: Player[]): RgCase[] {
  return players
    .map((p) => {
      const tier = tierOf(p.rgRisk, p.accountStatus);
      return { player: p, tier, signals: signalsFor(p), recommended: recommendAction(p, tier) };
    })
    .filter((c) => c.tier !== 'healthy')
    .sort((a, b) => b.player.rgRisk - a.player.rgRisk);
}

// ---- Intervention log (localStorage-backed mock persistence) --------------

export interface Intervention {
  id: string;
  playerId: string;
  playerName: string;
  action: RgActionKey;
  actionLabel: string;
  note?: string;
  operator: string;
  createdAt: string;
}

const LOG_KEY = 'crm_rg_interventions_v1';

export function getInterventions(): Intervention[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
}

export function logIntervention(
  player: Player,
  action: RgActionKey,
  note = '',
  operator = 'Operator',
): Intervention[] {
  const entry: Intervention = {
    id: `RG-${Date.now()}`,
    playerId: player.id,
    playerName: player.name,
    action,
    actionLabel: RG_ACTIONS[action].label,
    note,
    operator,
    createdAt: new Date().toISOString(),
  };
  const all = [entry, ...getInterventions()];
  if (typeof window !== 'undefined') localStorage.setItem(LOG_KEY, JSON.stringify(all));
  return all;
}

/** Ids of players that already have a logged intervention. */
export function resolvedIds(): Set<string> {
  return new Set(getInterventions().map((i) => i.playerId));
}

// ---- Player safeguards: limits, cool-off & self-exclusion -----------------

export type LimitPeriod = 'daily' | 'weekly' | 'monthly';

export interface PlayerSafeguards {
  depositLimit?: { amount: number; period: LimitPeriod };
  lossLimit?: { amount: number; period: LimitPeriod };
  sessionLimitMins?: number;
  coolOffUntil?: string;      // ISO date
  selfExcludedUntil?: string; // ISO date, or 'permanent'
  updatedAt: string;
}

const SAFEGUARD_KEY = 'crm_rg_safeguards_v1';

export function getAllSafeguards(): Record<string, PlayerSafeguards> {
  if (typeof window === 'undefined') return {};
  return JSON.parse(localStorage.getItem(SAFEGUARD_KEY) || '{}');
}

export function getSafeguards(playerId: string): PlayerSafeguards | undefined {
  return getAllSafeguards()[playerId];
}

export function saveSafeguards(playerId: string, patch: Partial<PlayerSafeguards>): Record<string, PlayerSafeguards> {
  const all = getAllSafeguards();
  all[playerId] = { ...all[playerId], ...patch, updatedAt: new Date().toISOString() } as PlayerSafeguards;
  if (typeof window !== 'undefined') localStorage.setItem(SAFEGUARD_KEY, JSON.stringify(all));
  return all;
}

// ---- Overview aggregation for the command-center dashboard ----------------

export interface RgOverview {
  total: number;
  critical: number;
  high: number;
  monitor: number;
  healthy: number;
  flagged: number;
  avgRisk: number;
  selfExcluded: number;
  activeLimits: number;
  interventions: number;
  /** Portfolio-level RG risk over the last 8 weeks (0-100). */
  trend: { label: string; value: number }[];
  /** Top behavioural markers across the flagged base. */
  topSignals: { label: string; count: number; severity: RgSignal['severity'] }[];
}

export function buildOverview(players: Player[]): RgOverview {
  const tiers = players.map((p) => tierOf(p.rgRisk, p.accountStatus));
  const critical = tiers.filter((t) => t === 'critical').length;
  const high = tiers.filter((t) => t === 'high').length;
  const monitor = tiers.filter((t) => t === 'monitor').length;
  const healthy = tiers.filter((t) => t === 'healthy').length;
  const avgRisk = players.length ? Math.round(players.reduce((s, p) => s + p.rgRisk, 0) / players.length) : 0;

  // Aggregate signal frequency across the flagged base.
  const counts = new Map<string, { count: number; severity: RgSignal['severity'] }>();
  players.forEach((p) => {
    if (tierOf(p.rgRisk, p.accountStatus) === 'healthy') return;
    signalsFor(p).forEach((s) => {
      const prev = counts.get(s.label);
      counts.set(s.label, { count: (prev?.count || 0) + 1, severity: s.severity });
    });
  });
  const topSignals = [...counts.entries()]
    .map(([label, v]) => ({ label, count: v.count, severity: v.severity }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Deterministic 8-week trend anchored to current avg risk (mock series).
  const trend = Array.from({ length: 8 }, (_, i) => {
    const wobble = Math.round(Math.sin(i * 1.1) * 6 + (i - 7) * 1.2);
    return { label: `W${i + 1}`, value: Math.max(0, Math.min(100, avgRisk + wobble)) };
  });

  const safeguards = getAllSafeguards();
  const now = Date.now();
  const activeLimits = Object.values(safeguards).filter(
    (s) => s.depositLimit || s.lossLimit || s.sessionLimitMins || (s.coolOffUntil && new Date(s.coolOffUntil).getTime() > now),
  ).length;

  return {
    total: players.length,
    critical, high, monitor, healthy,
    flagged: critical + high + monitor,
    avgRisk,
    selfExcluded: players.filter((p) => p.accountStatus === 'self_excluded').length,
    activeLimits,
    interventions: getInterventions().length,
    trend,
    topSignals,
  };
}

