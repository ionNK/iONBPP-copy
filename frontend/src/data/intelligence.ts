// Player Behaviour Intelligence Engine (CRM Phase 3)
// Turns raw ML scores (churn, promo propensity, RG risk) into behavioural cohorts,
// opportunity signals and driver analysis. All values are derived LIVE from the
// synced player dataset so the cockpit stays consistent with the Segments engine.

import { Player } from './players';

// ---- Score bands ----------------------------------------------------------

export interface Band {
  label: string;
  color: string;
}

export function scoreBand(v: number): Band {
  if (v >= 66) return { label: 'High', color: '#f87171' };
  if (v >= 33) return { label: 'Medium', color: '#fb923c' };
  return { label: 'Low', color: '#699951' };
}

// Value tiers are derived from LTV percentiles within the current population so
// the matrix adapts to whatever cohort is synced.
export function valueThresholds(players: Player[]) {
  const sorted = [...players].map((p) => p.ltv).sort((a, b) => a - b);
  const pct = (q: number) => {
    if (sorted.length === 0) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
    return sorted[idx];
  };
  return { mid: pct(0.5), high: pct(0.8) };
}

// ---- Behaviour matrix (Churn risk × Value) --------------------------------

export type QuadrantKey =
  | 'champions'
  | 'loyal'
  | 'at_risk_vip'
  | 'promising'
  | 'hibernating'
  | 'needs_attention';

export interface Quadrant {
  key: QuadrantKey;
  label: string;
  description: string;
  color: string;
  players: Player[];
  totalLtv: number;
}

// Classify a single player into a behaviour quadrant using churn risk + value tier.
export function classifyPlayer(p: Player, t: { mid: number; high: number }): QuadrantKey {
  const highValue = p.ltv >= t.high;
  const midValue = p.ltv >= t.mid;
  const churn = p.churnScore;

  if (churn >= 66) {
    // High churn risk
    if (highValue) return 'at_risk_vip';
    if (midValue) return 'needs_attention';
    return 'hibernating';
  }
  if (churn >= 33) {
    // Medium churn risk
    if (highValue) return 'loyal';
    return 'promising';
  }
  // Low churn risk
  if (highValue) return 'champions';
  if (midValue) return 'loyal';
  return 'promising';
}

const QUADRANT_META: Record<QuadrantKey, { label: string; description: string; color: string }> = {
  champions: { label: 'Champions', description: 'High value, loyal — protect & reward', color: '#F2D641' },
  loyal: { label: 'Loyal', description: 'Consistent, engaged players', color: '#699951' },
  at_risk_vip: { label: 'At-Risk VIPs', description: 'High value but drifting — win them back', color: '#f87171' },
  promising: { label: 'Promising', description: 'Growing engagement, nurture upward', color: '#38bdf8' },
  hibernating: { label: 'Hibernating', description: 'Low value, disengaging — low-cost reactivation', color: '#a1a1aa' },
  needs_attention: { label: 'Needs Attention', description: 'Mid value slipping toward churn', color: '#fb923c' },
};

export function buildQuadrants(players: Player[]): Quadrant[] {
  const t = valueThresholds(players);
  const groups: Record<QuadrantKey, Player[]> = {
    champions: [], loyal: [], at_risk_vip: [], promising: [], hibernating: [], needs_attention: [],
  };
  players.forEach((p) => groups[classifyPlayer(p, t)].push(p));

  return (Object.keys(groups) as QuadrantKey[]).map((key) => ({
    key,
    ...QUADRANT_META[key],
    players: groups[key],
    totalLtv: groups[key].reduce((s, p) => s + p.ltv, 0),
  }));
}

// ---- Opportunity feed -----------------------------------------------------
// Auto-generated action cards. Each carries a segment payload so the "Target"
// button can hand off to the promotion wizard (same flow as CRM Segments).

export type Urgency = 'high' | 'medium' | 'low';

export interface Opportunity {
  id: string;
  title: string;
  insight: string;
  action: string;
  urgency: Urgency;
  count: number;
  totalLtv: number;
  segmentName: string; // audience label passed to the wizard
  metric: 'churn' | 'propensity' | 'rg' | 'value';
}

const money = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
};

export function buildOpportunities(players: Player[]): Opportunity[] {
  const t = valueThresholds(players);
  const out: Opportunity[] = [];

  // 1. High-value players drifting to churn → win-back
  const atRiskVips = players.filter((p) => p.churnScore >= 60 && p.ltv >= t.high);
  if (atRiskVips.length) {
    const ltv = atRiskVips.reduce((s, p) => s + p.ltv, 0);
    out.push({
      id: 'opp-winback-vip',
      title: 'VIP win-back opportunity',
      insight: `${atRiskVips.length} high-value players are drifting toward churn, putting ${money(ltv)} in lifetime value at risk.`,
      action: 'Launch a personalised win-back',
      urgency: 'high',
      count: atRiskVips.length,
      totalLtv: ltv,
      segmentName: 'At-Risk VIPs',
      metric: 'churn',
    });
  }

  // 2. Highly promo-responsive & engaged → upsell / cross-sell
  const promoReady = players.filter((p) => p.promoPropensity >= 66 && p.churnScore < 50);
  if (promoReady.length) {
    const ltv = promoReady.reduce((s, p) => s + p.ltv, 0);
    out.push({
      id: 'opp-upsell',
      title: 'High-propensity upsell',
      insight: `${promoReady.length} engaged players respond strongly to offers — prime for a value-building campaign.`,
      action: 'Target with a deposit-match offer',
      urgency: 'medium',
      count: promoReady.length,
      totalLtv: ltv,
      segmentName: 'Promo-Responsive Players',
      metric: 'propensity',
    });
  }

  // 3. Dormant / low-value disengaging → low-cost reactivation
  const dormant = players.filter((p) => p.churnScore >= 66 && p.ltv < t.mid);
  if (dormant.length) {
    const ltv = dormant.reduce((s, p) => s + p.ltv, 0);
    out.push({
      id: 'opp-reactivate',
      title: 'Low-cost reactivation',
      insight: `${dormant.length} disengaging players could be revived with a low-cost free-bet nudge.`,
      action: 'Send a free-bet reactivation',
      urgency: 'low',
      count: dormant.length,
      totalLtv: ltv,
      segmentName: 'Hibernating Players',
      metric: 'churn',
    });
  }

  // 4. Elevated RG risk → responsible-gaming intervention (no marketing)
  const rgRisk = players.filter((p) => p.rgRisk >= 66);
  if (rgRisk.length) {
    out.push({
      id: 'opp-rg',
      title: 'Responsible-gaming review',
      insight: `${rgRisk.length} players show elevated RG risk signals and should be reviewed — exclude from marketing.`,
      action: 'Route to RG intervention queue',
      urgency: 'high',
      count: rgRisk.length,
      totalLtv: rgRisk.reduce((s, p) => s + p.ltv, 0),
      segmentName: 'Elevated RG Risk',
      metric: 'rg',
    });
  }

  // Order: high urgency first, then by value at stake.
  const rank: Record<Urgency, number> = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.urgency] - rank[b.urgency] || b.totalLtv - a.totalLtv);
}

// ---- Next-Best-Action (per player) ----------------------------------------
// Turns an individual player's scores into a single prioritised recommendation,
// including sportsbook ↔ casino cross-sell. Surfaced on Player 360.

export type NbaKind =
  | 'rg_intervention'
  | 'vip_winback'
  | 'reactivation'
  | 'cross_sell'
  | 'upsell'
  | 'onboard'
  | 'nurture';

export interface NextBestAction {
  kind: NbaKind;
  title: string;
  rationale: string;
  channel: 'SMS' | 'Email' | 'Push' | 'VIP host' | 'RG team';
  offer: string;
  priority: Urgency;
  confidence: number; // 0-100
}

const NBA_RANK: Record<Urgency, number> = { high: 0, medium: 1, low: 2 };

export function nbaFor(p: Player): NextBestAction {

  // 1. Responsible gaming always wins — never market to elevated RG risk.
  if (p.rgRisk >= 66) {
    return {
      kind: 'rg_intervention',
      title: 'Responsible-gaming check-in',
      rationale: 'Elevated RG risk signals — suppress marketing and route for review.',
      channel: 'RG team',
      offer: 'No offer — welfare review',
      priority: 'high',
      confidence: Math.min(99, 60 + Math.round(p.rgRisk / 3)),
    };
  }

  const t = { high: 100000, mid: 20000 };
  const highValue = p.ltv >= t.high;

  // 2. High-value drifting → VIP win-back.
  if (p.churnScore >= 60 && highValue) {
    return {
      kind: 'vip_winback',
      title: 'VIP win-back outreach',
      rationale: 'High lifetime value with rising churn risk — protect the relationship.',
      channel: 'VIP host',
      offer: 'Personalised reload + VIP perk',
      priority: 'high',
      confidence: Math.min(95, 55 + Math.round(p.churnScore / 3)),
    };
  }

  // 3. Cross-sell: single-product player likely to convert to the other vertical.
  if (p.promoPropensity >= 55 && p.primaryProduct !== 'mixed' && p.churnScore < 60) {
    const to = p.primaryProduct === 'sportsbook' ? 'casino' : 'sportsbook';
    return {
      kind: 'cross_sell',
      title: `Cross-sell into ${to}`,
      rationale: `Engaged ${p.primaryProduct}-only player with strong offer response — introduce ${to}.`,
      channel: 'Push',
      offer: to === 'casino' ? 'Free casino spins' : 'Sportsbook free bet',
      priority: 'medium',
      confidence: Math.min(90, 45 + Math.round(p.promoPropensity / 3)),
    };
  }

  // 4. Disengaging low/mid value → low-cost reactivation.
  if (p.churnScore >= 66) {
    return {
      kind: 'reactivation',
      title: 'Low-cost reactivation',
      rationale: 'Disengaging player — a small free-bet nudge may revive activity.',
      channel: 'SMS',
      offer: 'Small free bet',
      priority: 'low',
      confidence: Math.min(80, 40 + Math.round(p.promoPropensity / 4)),
    };
  }

  // 5. Engaged & responsive → upsell.
  if (p.promoPropensity >= 66) {
    return {
      kind: 'upsell',
      title: 'Value-building upsell',
      rationale: 'Highly responsive and engaged — grow deposit value.',
      channel: 'Email',
      offer: 'Deposit-match offer',
      priority: 'medium',
      confidence: Math.min(92, 50 + Math.round(p.promoPropensity / 3)),
    };
  }

  // 6. Brand-new player → onboard.
  if (p.lifecycle === 'new') {
    return {
      kind: 'onboard',
      title: 'Onboarding nudge',
      rationale: 'Recently registered — guide toward first meaningful activity.',
      channel: 'Email',
      offer: 'Welcome free bet',
      priority: 'medium',
      confidence: 70,
    };
  }

  // 7. Default steady-state nurture.
  return {
    kind: 'nurture',
    title: 'Maintain & nurture',
    rationale: 'Healthy, engaged player — keep warm with regular relevant content.',
    channel: 'Push',
    offer: 'Content / odds boost',
    priority: 'low',
    confidence: 60,
  };
}

export function rankNba(players: Player[]): { player: Player; nba: NextBestAction }[] {
  return players
    .map((player) => ({ player, nba: nbaFor(player) }))

    .sort((a, b) => NBA_RANK[a.nba.priority] - NBA_RANK[b.nba.priority] || b.nba.confidence - a.nba.confidence);
}

// ---- CLV forecast ---------------------------------------------------------
// Projects a 12-month customer lifetime value from current value, monetisation
// rate (ARPU) and retention (inverse of churn). Simple, explainable model —
// swappable for a real regression later without changing the UI contract.

export interface ClvForecast {
  current: number;      // current realised LTV
  projected: number;    // projected 12-month LTV
  uplift: number;       // projected - current
  upliftPct: number;    // uplift as % of current
  retention: number;    // 0-1 modelled 12-month retention
  confidence: number;   // 0-100
}

export function clvFor(p: Player): ClvForecast {
  // Retention falls as churn rises; deposit cadence adds stickiness.
  const churnFactor = 1 - p.churnScore / 100;
  const cadenceBoost = Math.min(0.15, p.depositFrequency * 0.02);
  const retention = Math.max(0.05, Math.min(0.98, churnFactor * 0.85 + cadenceBoost));

  // Annual monetisation from ARPU, discounted by modelled retention.
  const annualValue = p.arpu * 12 * retention;
  const projected = Math.round(p.ltv + annualValue);
  const uplift = projected - p.ltv;
  const upliftPct = p.ltv > 0 ? Math.round((uplift / p.ltv) * 100) : 0;

  // More history + verified identity → higher confidence.
  const historyConf = Math.min(30, Math.round(p.totalSessions / 20));
  const kycConf = p.kycStatus === 'verified' ? 20 : 0;
  const confidence = Math.min(95, 45 + historyConf + kycConf);

  return { current: p.ltv, projected, uplift, upliftPct, retention, confidence };
}

export interface ClvSummary {
  currentTotal: number;
  projectedTotal: number;
  upliftTotal: number;
  upliftPct: number;
  top: { player: Player; forecast: ClvForecast }[];
}

export function buildClvSummary(players: Player[], topN = 5): ClvSummary {
  const rows = players.map((player) => ({ player, forecast: clvFor(player) }));
  const currentTotal = rows.reduce((s, r) => s + r.forecast.current, 0);
  const projectedTotal = rows.reduce((s, r) => s + r.forecast.projected, 0);
  const upliftTotal = projectedTotal - currentTotal;
  const top = [...rows].sort((a, b) => b.forecast.uplift - a.forecast.uplift).slice(0, topN);
  return {
    currentTotal,
    projectedTotal,
    upliftTotal,
    upliftPct: currentTotal > 0 ? Math.round((upliftTotal / currentTotal) * 100) : 0,
    top,
  };
}

// ---- Bonus-abuse / fraud risk ---------------------------------------------
// Heuristic risk score flagging bonus abuse and suspicious money movement.
// Explainable: every point of score maps to a named reason chip.

export interface AbuseRisk {
  score: number;         // 0-100
  band: Band;
  reasons: string[];
}

export function abuseRiskFor(p: Player): AbuseRisk {
  let score = 0;
  const reasons: string[] = [];

  // 1. Heavy bonus reliance relative to revenue.
  if (p.bonusCostRatio >= 0.5) { score += 35; reasons.push('Very high bonus reliance'); }
  else if (p.bonusCostRatio >= 0.35) { score += 20; reasons.push('Elevated bonus reliance'); }

  // 2. Withdraws far more than deposits (bonus extraction pattern).
  const wdRatio = p.totalDeposits > 0 ? p.totalWithdrawals / p.totalDeposits : 0;
  if (wdRatio >= 1.5) { score += 25; reasons.push('Withdrawals >> deposits'); }
  else if (wdRatio >= 1.1) { score += 12; reasons.push('Withdrawals exceed deposits'); }

  // 3. Low engagement but active balances — mismatched activity.
  if (p.totalBets < 30 && p.bonusBalance > 0) { score += 15; reasons.push('Bonus balance, minimal play'); }

  // 4. Unverified / rejected KYC amplifies risk.
  if (p.kycStatus === 'rejected') { score += 20; reasons.push('KYC rejected'); }
  else if (p.kycStatus === 'unverified') { score += 10; reasons.push('KYC unverified'); }

  // 5. Very low deposit cadence with high bonus take.
  if (p.depositFrequency <= 1 && p.bonusCostRatio >= 0.3) { score += 8; reasons.push('One-off depositor on bonuses'); }

  score = Math.min(100, score);
  if (reasons.length === 0) reasons.push('No abuse signals detected');
  return { score, band: scoreBand(score), reasons };
}

export function rankAbuseRisk(players: Player[], topN = 5): { player: Player; risk: AbuseRisk }[] {
  return players
    .map((player) => ({ player, risk: abuseRiskFor(player) }))
    .filter((r) => r.risk.score >= 33)
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, topN);
}

// ---- Behaviour drivers ----------------------------------------------------


// Population-level signals explaining what is moving the scores.

export interface Driver {
  label: string;
  detail: string;
  share: number; // 0-100, portion of population affected
  direction: 'up' | 'down';
}

export function buildDrivers(players: Player[]): Driver[] {
  const n = players.length || 1;
  const pct = (c: number) => Math.round((c / n) * 100);

  const lowDeposit = players.filter((p) => p.depositFrequency <= 2).length;
  const bonusReliant = players.filter((p) => p.bonusCostRatio >= 0.35).length;
  const lowSessions = players.filter((p) => p.totalSessions < 100).length;
  const highPropensity = players.filter((p) => p.promoPropensity >= 66).length;

  const drivers: Driver[] = [
    { label: 'Declining deposit frequency', detail: '≤ 2 deposits / month', share: pct(lowDeposit), direction: 'down' },
    { label: 'Bonus reliance', detail: 'Bonus cost ratio ≥ 35%', share: pct(bonusReliant), direction: 'up' },
    { label: 'Falling session activity', detail: 'Fewer than 100 lifetime sessions', share: pct(lowSessions), direction: 'down' },
    { label: 'Offer responsiveness', detail: 'Promo propensity ≥ 66', share: pct(highPropensity), direction: 'up' },
  ];
  return drivers.sort((a, b) => b.share - a.share);

}
