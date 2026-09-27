/**
 * Promotion simulator: pure evaluation of a promotion's rule config against
 * a mock player persona and an ordered event sequence (/admin/simulator).
 *
 * Rule shape comes from the promotion model the wizard produces
 * (src/app/admin/promotions/new/draft.ts, seeded from
 * src/data/promotion-templates.ts): triggers[].rules[] over event-catalog
 * params, counting[] over aggregation-catalog params, promotion channels,
 * reward (freebet or cash: fixed or odds tiers +
 * payoutCap), budget and schedule. Approval and alert thresholds are read
 * from lib/settings.ts. Everything here is deterministic: no Date.now(), no
 * randomness. Where the data model has no rule for a check the check is
 * SKIPPED with reason "Not configured": never a fabricated pass.
 */
import { PROMOTION_TEMPLATES, getPromotionType } from '@/data/promotion-templates';
import type { PromotionTemplate, TemplatePrefill, TierRow } from '@/data/promotion-templates';
import { BET_RESTRICTIONS, getCatalogEvent } from '@/data/event-catalog';
import type { EventId } from '@/data/event-catalog';
import { TRIGGER_JOIN_LABELS, triggerGroups } from '@/app/admin/promotions/new/draft';
import type { Trigger, TriggerRule } from '@/app/admin/promotions/new/draft';
import { CHANNEL_LABELS, NOTIFICATION_TRIGGERS, NOTIFICATION_TRIGGER_LABELS, NOTIFICATION_TRIGGER_SHORT, channelSummary, notificationChannelSummary, renderNotificationText, smsSegments } from '@/lib/promotions';
import type { Channel, NotificationChannel, NotificationTrigger, PlaceholderValues, Promo } from '@/lib/promotions';
import type { Settings } from '@/lib/settings';
import { features } from '@/config/features';

/* ------------------------------------------------------------------ */
/* Personas                                                            */
/* ------------------------------------------------------------------ */

export type KycStatus = 'Verified' | 'Pending' | 'Rejected';
export type RgStatus = 'None' | 'Cooling off' | 'Self-excluded';

export interface Persona {
  id: string;
  label: string;
  kycStatus: KycStatus;
  rgStatus: RgStatus;
  market: string;
  lifetimeDeposits: number;
}

export const PERSONAS: Persona[] = [
  { id: 'new-today', label: 'New · registered today', kycStatus: 'Verified', rgStatus: 'None', market: 'Zambia', lifetimeDeposits: 50 },
  { id: 'active-depositor', label: 'Active depositor', kycStatus: 'Verified', rgStatus: 'None', market: 'Zambia', lifetimeDeposits: 4820 },
  { id: 'kyc-pending', label: 'KYC pending', kycStatus: 'Pending', rgStatus: 'None', market: 'Zambia', lifetimeDeposits: 120 },
  { id: 'self-excluded', label: 'Self-excluded', kycStatus: 'Verified', rgStatus: 'Self-excluded', market: 'Zambia', lifetimeDeposits: 9340 },
];

export function getPersona(id: string): Persona {
  return PERSONAS.find((persona) => persona.id === id) ?? PERSONAS[0];
}

/* ------------------------------------------------------------------ */
/* Scenario events                                                     */
/* ------------------------------------------------------------------ */

/** One simulated player event; params are keyed by event-catalog names. */
export interface ScenarioEvent {
  id: string;
  eventId: EventId;
  offsetMinutes: number;
  params: Record<string, string>;
  /** Vertical / provider context for ledger preview (not a catalog param). */
  gameCode: string;
}

export interface Scenario {
  promoId: string;
  personaId: string;
  /** datetime-local: YYYY-MM-DDTHH:mm (Africa/Lusaka wall-clock). */
  fixedAt: string;
  /** Player surface being simulated; required for promotion-channel eligibility. */
channel: Channel;
events: ScenarioEvent[];
}

/** Key fields the inline picker exposes per event (from the catalog). */
export const PICKER_FIELDS: Record<EventId, string[]> = {
  bet_placed: ['Bet Type', 'Stake', 'Stake Funding', 'Selections', 'Odds', 'Pre-match', 'Live'],
  bet_settled: ['Bet Type', 'Stake', 'Stake Funding', 'Selections', 'Result', 'Losing Legs', 'Remaining Odds', 'Cash-out multiplier', 'Voided', 'Cancelled', 'Payout'],
  deposit: ['Amount', 'Method', 'First Deposit'],
  withdrawal: ['Amount', 'Status'],
  registration: ['Method', 'Referral Code'],
  login: ['Days Inactive', 'Platform'],
};

/** Game / provider codes offered by the picker (mirrors PROVIDER_SEED in lib/settings). */
export const GAME_CODES = ['SBK', 'SPR', 'SMS', 'IMN'];

let eventSeq = 0;
export function newEventId(): string {
  eventSeq += 1;
  return `ev-${eventSeq}`;
}

export function defaultEvent(eventId: EventId): ScenarioEvent {
  const base: ScenarioEvent = { id: newEventId(), eventId, offsetMinutes: 0, params: {}, gameCode: 'SBK' };
  const catalog = getCatalogEvent(eventId);
  for (const name of PICKER_FIELDS[eventId]) {
    const param = catalog?.params.find((p) => p.name === name);
    if (!param) continue;
    /* Booleans default to 'No', except 'Pre-match': an ordinary sportsbook bet is placed before kick-off (so 'Live' stays 'No'). */
    if (param.type === 'boolean') base.params[name] = name === 'Pre-match' ? 'Yes' : 'No';
    else if (param.type === 'enum' && param.options) base.params[name] = param.options[0];
    else base.params[name] = '';
  }
  return base;
}

/* ------------------------------------------------------------------ */
/* Presets                                                             */
/* ------------------------------------------------------------------ */

export interface Preset {
  id: string;
  label: string;
  promoId: string;
  personaId: string;
  events: Omit<ScenarioEvent, 'id'>[];
}

const settledMultibet = (offset: number, params: Record<string, string>): Omit<ScenarioEvent, 'id'> => ({
  eventId: 'bet_settled', offsetMinutes: offset, gameCode: 'SBK',
  params: { 'Bet Type': 'Multibet', Stake: '50', 'Stake Funding': 'Cash', Result: 'Lost', 'Losing Legs': '1', 'Remaining Odds': '48', 'Cash-out multiplier': '', Voided: 'No', Cancelled: 'No', Payout: '0', ...params },
});

const aviatorBet = (offset: number): Omit<ScenarioEvent, 'id'> => ({
  eventId: 'bet_settled', offsetMinutes: offset, gameCode: 'SPR',
  params: { 'Bet Type': 'Single', Stake: '5', 'Stake Funding': 'Cash', Result: 'Cashed Out', 'Losing Legs': '0', 'Remaining Odds': '', 'Cash-out multiplier': '2.4', Voided: 'No', Cancelled: 'No', Payout: '12' },
});

export const PRESETS: Preset[] = [
  { id: 'multibet-one-leg', label: 'Qualifying multibet loses by one leg', promoId: 'PR-002', personaId: 'active-depositor', events: [settledMultibet(-30, {})] },
    { id: 'aviator-qualifying-day', label: 'Aviator qualifying day (10 bets)', promoId: 'PR-001', personaId: 'new-today', events: Array.from({ length: 10 }, (_, i) => aviatorBet(-(10 - i) * 12)) },
  { id: 'aviator-partial-day', label: 'Aviator partial day (9 bets, should not qualify)', promoId: 'PR-001', personaId: 'new-today', events: Array.from({ length: 9 }, (_, i) => aviatorBet(-(9 - i) * 12)) },
  { id: 'cashed-out', label: 'Cashed-out bet (should not qualify)', promoId: 'PR-002', personaId: 'active-depositor', events: [settledMultibet(-30, { Result: 'Cashed Out', 'Cash-out multiplier': '1.6', 'Losing Legs': '0', Payout: '80' })] },
  { id: 'self-excluded', label: 'Self-excluded player (should not qualify)', promoId: 'PR-002', personaId: 'self-excluded', events: [settledMultibet(-30, {})] },
];

export function templateFor(promo: Promo): PromotionTemplate | undefined {
  const type = promo.type.toLowerCase();
  const name = promo.name.toLowerCase();
  return PROMOTION_TEMPLATES.find((tpl) => {
    const label = getPromotionType(tpl.prefill.type ?? 'welcome_offer')?.label.toLowerCase() ?? '';
    return name.includes(tpl.name.toLowerCase()) || (label && type.includes(label)) || (tpl.id === 'welcome_offer' && type.includes('welcome')) || (tpl.id === 'cashback' && type.includes('cashback'));
  });
}

export type CheckStatus = 'PASS' | 'FAIL' | 'SKIPPED';
export type StageId = 'schedule' | 'eligibility' | 'trigger' | 'reward' | 'budget' | 'approval' | 'ledger' | 'notifications';
export interface RuleCheck { label: string; status: CheckStatus; actual: string; required: string; reason?: string; }
export interface LedgerLine { side: 'Credit' | 'Debit'; account: string; amount: number; }
/** A player message as it would be delivered: placeholders already substituted. */
export interface DeliveredMessage { trigger: NotificationTrigger; channels: NotificationChannel[]; title: string; body: string; smsSegments: number | null; }
export interface StageResult { id: StageId; title: string; status: CheckStatus; summary: string; checks: RuleCheck[]; config: [string, string][]; inputs: [string, string][]; notes?: string[]; ledger?: { lines: LedgerLine[]; chips: string[] }; messages?: DeliveredMessage[]; }
export interface SimulationResult { outcome: 'PASS' | 'FAIL'; failedAt: StageId | null; stages: StageResult[]; reward: { amount: number; currency: 'ZMW'; kind: 'freebet' | 'cash' | 'none'; label: string }; }

const DAY_MS = 24 * 60 * 60 * 1000;
/** Personas carry no name; previews substitute {{firstName}} with a fixed sample so runs stay deterministic. */
const SAMPLE_FIRST_NAME = 'Chanda';
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export const fmtK = (n: number) => `K ${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export function parseFixedAt(value: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])) : NaN;
}
const pad = (n: number) => String(n).padStart(2, '0');
export function fmtDateTime(ms: number): string {
  if (!Number.isFinite(ms)) return '·';
  const d = new Date(ms);
  return `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()][0].toUpperCase()}${MONTHS[d.getUTCMonth()].slice(1)} ${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
function parseScheduleToken(token: string, year: number): number | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(token);
  if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const dm = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(token);
  if (!dm) return null;
  const month = MONTHS.indexOf(dm[2].toLowerCase());
  return month < 0 ? null : Date.UTC(year, month, Number(dm[1]));
}
function scheduleWindow(schedule: string, year: number): { start: number | null; end: number | null; ongoing: boolean } {
  const [startToken = '', endToken = ''] = schedule.split(/\s[–-]\s/);
  const ongoing = endToken.trim().toLowerCase() === 'ongoing';
  const end = ongoing ? null : parseScheduleToken(endToken.trim(), year);
  return { start: parseScheduleToken(startToken.trim(), year), end: end === null ? null : end + DAY_MS - 1, ongoing };
}
const toNumber = (v: string | undefined): number | null => { const n = Number(v); return v === undefined || v.trim() === '' || !Number.isFinite(n) ? null : n; };
/**
 * Envelope fields the engine derives rather than the operator entering them. Restrictions are a
 * fixed set on every trigger, so any restriction flag the event does not carry defaults to 'No':
 * a bet not marked voided / cancelled / cashed out is none of those. `Cashed Out` is the
 * boolean view of `Result = Cashed Out` when a Result is present. Explicit values (presets) win.
 */
export function withDerivedParams(event: ScenarioEvent): Record<string, string> {
  const params = { ...event.params };
  for (const restriction of BET_RESTRICTIONS) {
    if (params[restriction.param] !== undefined && params[restriction.param] !== '') continue;
    if (restriction.param === 'Cashed Out' && params.Result !== undefined) {
      params['Cashed Out'] = params.Result.trim().toLowerCase() === 'cashed out' ? 'Yes' : 'No';
    } else {
      params[restriction.param] = 'No';
    }
  }
  return params;
}
function evaluateRule(rule: TriggerRule, params: Record<string, string>): { pass: boolean; actual: string } {
  const raw = params[rule.param]; const actual = raw === undefined || raw === '' ? '·' : raw;
  const numeric = rule.type === 'integer' || rule.type === 'float'; const a = numeric ? toNumber(raw) : null; const b = numeric ? toNumber(rule.value) : null; const b2 = numeric ? toNumber(rule.value2) : null;
  const list = rule.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean); const eq = (raw ?? '').trim().toLowerCase() === rule.value.trim().toLowerCase();
  switch (rule.operator) {
    case '>': return { pass: a !== null && b !== null && a > b, actual }; case '>=': return { pass: a !== null && b !== null && a >= b, actual }; case '<': return { pass: a !== null && b !== null && a < b, actual }; case '<=': return { pass: a !== null && b !== null && a <= b, actual };
    case '=': return { pass: numeric ? a !== null && b !== null && a === b : eq, actual }; case '!=': return { pass: numeric ? a !== null && b !== null && a !== b : !eq && raw !== undefined, actual };
    case 'between': return { pass: a !== null && b !== null && b2 !== null && a >= b && a <= b2, actual }; case 'not_between': return { pass: a !== null && b !== null && b2 !== null && (a < b || a > b2), actual };
    case 'in': return { pass: list.includes((raw ?? '').trim().toLowerCase()), actual }; case 'not_in': return { pass: raw !== undefined && raw !== '' && !list.includes(raw.trim().toLowerCase()), actual };
    case 'contains': return { pass: (raw ?? '').toLowerCase().includes(rule.value.toLowerCase()), actual }; case 'not_contains': return { pass: raw !== undefined && !raw.toLowerCase().includes(rule.value.toLowerCase()), actual };
    case 'is_set': return { pass: raw !== undefined && raw !== '', actual }; case 'is_empty': return { pass: raw === undefined || raw === '', actual }; default: return { pass: false, actual };
  }
}
function ruleRequired(rule: TriggerRule): string { return rule.operator === 'is_set' || rule.operator === 'is_empty' ? rule.operator.replace('_', ' ') : rule.operator === 'between' || rule.operator === 'not_between' ? `${rule.operator.replace('_', ' ')} ${rule.value} – ${rule.value2 ?? '·'}` : `${rule.operator} ${rule.value}`; }
const skipped = (label: string, reason = 'Not configured'): RuleCheck => ({ label, status: 'SKIPPED', actual: '·', required: '·', reason });
const check = (label: string, pass: boolean, actual: string, required: string): RuleCheck => ({ label, status: pass ? 'PASS' : 'FAIL', actual, required });
function stageStatus(checks: RuleCheck[]): CheckStatus { return checks.some((c) => c.status === 'FAIL') ? 'FAIL' : checks.some((c) => c.status === 'PASS') ? 'PASS' : 'SKIPPED'; }

export function simulate(promo: Promo, persona: Persona, events: ScenarioEvent[], fixedAt: string, settings: Settings, channel: Channel): SimulationResult {
  const now = parseFixedAt(fixedAt); const year = Number.isFinite(now) ? new Date(now).getUTCFullYear() : 2026;
  const prefill: TemplatePrefill = templateFor(promo)?.prefill ?? {}; const qualification = prefill.qualification;
  const ordered = [...events].sort((a, b) => a.offsetMinutes - b.offsetMinutes); const lastEventAt = ordered.length ? now + ordered[ordered.length - 1].offsetMinutes * 60_000 : now; const stages: StageResult[] = [];
  const window = scheduleWindow(promo.schedule, year); const scheduleChecks: RuleCheck[] = [];
  if (promo.status === 'draft' || window.start === null) scheduleChecks.push(skipped('Promotion window', promo.status === 'draft' ? 'Draft promotions have no schedule' : 'Not configured'));
  else { scheduleChecks.push(check('Event after start', lastEventAt >= window.start, fmtDateTime(lastEventAt), `≥ ${fmtDateTime(window.start)}`)); scheduleChecks.push(window.ongoing ? check('Event before end', true, fmtDateTime(lastEventAt), 'ongoing (no end)') : window.end !== null ? check('Event before end', lastEventAt <= window.end, fmtDateTime(lastEventAt), `≤ ${fmtDateTime(window.end)}`) : skipped('Event before end')); }
  scheduleChecks.push(check('Promotion status', promo.status === 'active' || promo.status === 'scheduled', promo.status, 'active or scheduled'));
  stages.push({ id: 'schedule', title: 'Schedule', status: stageStatus(scheduleChecks), checks: scheduleChecks, summary: window.start === null ? 'No schedule on this promotion' : `${promo.schedule} · ${settings.timezone}`, config: [['schedule', promo.schedule], ['timezone', settings.timezone], ['status', promo.status]], inputs: [['fixedAt', fmtDateTime(now)], ['lastEventAt', fmtDateTime(lastEventAt)], ['events', String(ordered.length)]] });
  const eligibilityChecks: RuleCheck[] = [];
const channelEligible = promo.channels.includes(channel);
eligibilityChecks.push({
label: 'Channel',
status: channelEligible ? 'PASS' : 'FAIL',
actual: CHANNEL_LABELS[channel],
required: channelSummary(promo.channels),
...(channelEligible ? {} : { reason: `Promotion is not available on ${CHANNEL_LABELS[channel]}.` }),
});
  eligibilityChecks.push(check('Market', persona.market === promo.market, persona.market, `= ${promo.market}`)); eligibilityChecks.push({ ...skipped('KYC status'), actual: persona.kycStatus }); eligibilityChecks.push(check('RG exclusion', persona.rgStatus !== 'Self-excluded', persona.rgStatus, 'not Self-excluded (platform rule)'));
  /* Eligibility is restricted to channels, market and platform rules. */
    stages.push({ id: 'eligibility', title: 'Eligibility', status: stageStatus(eligibilityChecks), checks: eligibilityChecks, summary: channelSummary(promo.channels), config: [['channels', channelSummary(promo.channels)], ['market', promo.market], ['kycRule', '·'], ['rgRule', 'platform: self-excluded blocked']], inputs: [['persona', persona.label], ['kycStatus', persona.kycStatus], ['rgStatus', persona.rgStatus], ['market', persona.market]] });
  const triggerChecks: RuleCheck[] = []; const triggers = qualification?.triggers ?? []; let qualifyingEvents: ScenarioEvent[] = [];
  if (!triggers.length) triggerChecks.push(skipped('Trigger rules'));
  else if (!ordered.length) triggerChecks.push(check('Event sequence', false, 'no events', 'at least one qualifying event'));
  else {
    /* Pre-match / Live are ordinary Bet Placed rules (boolean params), evaluated with every other trigger rule. */
    const perEvent = ordered.map((event) => { const params = withDerivedParams(event); const branches = triggers.filter((t) => t.eventId === event.eventId); const results = branches.map((t) => t.rules.map((rule) => ({ rule, ...evaluateRule(rule, params) }))); const satisfied = new Set(branches.filter((_, i) => results[i].every((r) => r.pass)).map((t) => t.id)); return { event, branches, results, satisfied }; });
    /* AND binds tighter than OR: a group qualifies when every trigger in it is satisfied by some event in the scenario. */
    const groups = triggerGroups(triggers); const satisfiedIds = new Set(perEvent.flatMap((p) => [...p.satisfied])); const groupResults = groups.map((group) => ({ group, pass: group.every((t) => satisfiedIds.has(t.id)) })); const winning = groupResults.find((g) => g.pass)?.group ?? null; const memberIds = new Set((winning ?? []).map((t) => t.id));
    qualifyingEvents = winning ? perEvent.filter((p) => [...p.satisfied].some((id) => memberIds.has(id))).map((p) => p.event) : [];
    const candidate = perEvent.find((p) => p.satisfied.size > 0) ?? perEvent[perEvent.length - 1];
    const chain = (group: Trigger[]) => group.map((t) => t.eventId).join(' AND ');
    triggerChecks.push(check('Event type', perEvent.some((p) => p.branches.length > 0), candidate.event.eventId, groups.map(chain).join(' OR ')));
       for (const r of candidate.results[0] ?? []) triggerChecks.push(check(r.rule.param, r.pass, r.actual, ruleRequired(r.rule)));
    if (groups.some((group) => group.length > 1)) groupResults.forEach(({ group, pass }, i) => triggerChecks.push(check(`Trigger group ${i + 1}`, pass, `${group.filter((t) => satisfiedIds.has(t.id)).length} of ${group.length} events seen`, `all of: ${chain(group)}`)));
    for (const rule of qualification?.counting ?? []) { const pool = /per day/i.test(rule.param) ? qualifyingEvents.filter((e) => Math.floor((now + e.offsetMinutes * 60_000) / DAY_MS) === Math.floor(lastEventAt / DAY_MS)) : qualifyingEvents; const value = /stake/i.test(rule.param) ? pool.reduce((sum, e) => sum + (toNumber(e.params.Stake) ?? 0), 0) : pool.length; const result = evaluateRule(rule, { [rule.param]: String(value) }); triggerChecks.push(check(rule.param, result.pass, /stake/i.test(rule.param) ? fmtK(value) : `counter ${value} of ${rule.value}`, ruleRequired(rule))); }
  }
  stages.push({ id: 'trigger', title: 'Trigger', status: stageStatus(triggerChecks), checks: triggerChecks, summary: triggers.length ? `${qualifyingEvents.length} of ${ordered.length} events qualify` : 'No trigger rules configured', config: [['event', triggers.map((t, i) => `${i > 0 ? `${TRIGGER_JOIN_LABELS[t.join ?? 'or']} ` : ''}${t.eventId}`).join(' ') || '·'], ...(qualification?.counting ?? []).map((r): [string, string] => ['counting', `${r.param} ${ruleRequired(r)}`])], inputs: ordered.map((e, i): [string, string] => [`event ${i + 1}`, `${e.eventId} · ${Object.entries(e.params).filter(([, v]) => v !== '').map(([k, v]) => `${k}=${v}`).join(', ')}`]) });
  let rewardAmount = 0; let rewardKind: SimulationResult['reward']['kind'] = 'none'; let rewardLabel = 'No reward configured'; const rewardChecks: RuleCheck[] = [];
  if (!prefill.rewardType) rewardChecks.push(skipped('Reward type'));
  else if (prefill.rewardType === 'freebet') { rewardKind = 'freebet'; const count = toNumber(prefill.freebetCount ?? '') ?? 0; const value = toNumber(prefill.freebetValue ?? '') ?? 0; rewardAmount = count * value; rewardLabel = `${count} × ${fmtK(value)} freebet`; rewardChecks.push(check('Freebet count', count > 0, String(count), '> 0')); rewardChecks.push(check('Freebet value', value > 0, fmtK(value), '> 0')); rewardChecks.push(check('Computed amount', rewardAmount > 0, fmtK(rewardAmount), 'count × value')); }
  else { rewardKind = 'cash'; rewardAmount = toNumber(prefill.fixedAmount ?? '') ?? 0; rewardLabel = 'fixed cash'; rewardChecks.push(check('Fixed amount', rewardAmount > 0, fmtK(rewardAmount), '> 0')); }
  rewardChecks.push(check('Currency', true, 'ZMW', 'ZMW (market currency)'));
  if (prefill.rewardType === 'cash' && prefill.payoutMode === 'tiers') { const event = qualifyingEvents[qualifyingEvents.length - 1]; const odds = toNumber(event?.params['Remaining Odds']); const stake = toNumber(event?.params.Stake) ?? 0; let tier: TierRow | undefined; for (const candidate of prefill.tiers ?? []) { if (odds !== null && odds >= (toNumber(candidate.odds) ?? Infinity) && (!tier || Number(candidate.odds) >= Number(tier.odds))) tier = candidate; } const multiplier = toNumber(tier?.multiplier) ?? 0; const uncapped = stake * multiplier; const cap = toNumber(prefill.payoutCap ?? ''); rewardAmount = cap === null ? uncapped : Math.min(uncapped, cap); rewardLabel = `stake × tier ${multiplier}${cap !== null && uncapped > cap ? ' (capped)' : ''}`; rewardChecks.length = 0; rewardChecks.push(check('Tier matched', Boolean(tier), odds === null ? '·' : `remaining odds ${odds}`, `≥ ${(prefill.tiers ?? []).map((t) => t.odds).join(' | ')}`)); rewardChecks.push(check('Computed amount', uncapped > 0, fmtK(uncapped), `${fmtK(stake)} × ${multiplier}`)); rewardChecks.push(cap === null ? skipped('Payout cap') : check('Payout cap', true, fmtK(rewardAmount), `≤ ${fmtK(cap)}${uncapped > cap ? ' · cap applied' : ''}`)); }
  rewardChecks.push(check('Currency', true, 'ZMW', 'ZMW (market currency)'));
  stages.push({ id: 'reward', title: 'Reward', status: stageStatus(rewardChecks), checks: rewardChecks, summary: rewardKind === 'none' ? rewardLabel : `${fmtK(rewardAmount)} · ${rewardLabel}`, config: [['rewardType', prefill.rewardType ?? '·'], ['payoutMode', prefill.payoutMode ?? '·'], ['freebetCount', prefill.freebetCount ?? '·'], ['freebetValue', prefill.freebetValue ?? '·'], ['tiers', prefill.tiers?.map((t) => `${t.odds}→×${t.multiplier}`).join(', ') ?? '·'], ['payoutCap', prefill.payoutCap ?? '·']], inputs: [['computedAmount', fmtK(rewardAmount)]] });
  /* Budget check stage (BR-6) — hidden behind features.budgets; the code is retained for re-enablement. */
  if (features.budgets) {
    const budgetChecks: RuleCheck[] = []; const budgetNotes: string[] = []; const threshold = (toNumber(prefill.alertThreshold ?? '') ?? settings.alertThreshold) / 100;
    if (promo.budget === null || promo.spend === null) { budgetChecks.push(skipped('Budget', 'No budget on this promotion')); budgetNotes.push('Award NOT blocked'); }
    else { const projected = promo.spend + rewardAmount; const ratio = projected / promo.budget; const alertFires = ratio >= threshold; budgetChecks.push(check('Spend + reward vs budget', true, `${fmtK(projected)} of ${fmtK(promo.budget)} (${Math.round(ratio * 100)}%)`, 'monitored only (BR-6)')); budgetChecks.push({ label: 'Alert threshold', status: 'PASS', actual: alertFires ? `alert fires at ${Math.round(threshold * 100)}%` : `${Math.round(ratio * 100)}% below ${Math.round(threshold * 100)}%`, required: `alert at ≥ ${Math.round(threshold * 100)}%` }); if (alertFires) budgetNotes.push(`Alert would fire at ${Math.round(threshold * 100)}%`); budgetNotes.push('Award NOT blocked'); }
    stages.push({ id: 'budget', title: 'Budget check', status: stageStatus(budgetChecks), checks: budgetChecks, notes: budgetNotes, summary: promo.budget === null ? 'No budget configured · award not blocked' : `${fmtK((promo.spend ?? 0) + rewardAmount)} / ${fmtK(promo.budget)} after award`, config: [['budget', promo.budget === null ? '·' : fmtK(promo.budget)], ['alertThreshold', `${Math.round(threshold * 100)}%`], ['earlyWarning', String(settings.earlyWarning)]], inputs: [['currentSpend', promo.spend === null ? '·' : fmtK(promo.spend)], ['reward', fmtK(rewardAmount)]] });
  }
  /* Approval routing basis: the promotion budget when budgets are enabled, otherwise the computed award value. */
  const approvalBasisLabel = features.budgets ? 'budget' : 'award value';
  const approvalBasisAmount = features.budgets ? (promo.budget ?? 0) : rewardAmount;
  const approvalChecks: RuleCheck[] = []; const routes = settings.automatedApprovalThreshold && approvalBasisAmount > settings.thresholdAmount;
  if (settings.automatedApprovalThreshold) { approvalChecks.push({ label: 'Automated promotion threshold', status: 'PASS', actual: routes ? `${approvalBasisLabel} ${fmtK(approvalBasisAmount)} > ${fmtK(settings.thresholdAmount)} · routes to Approvals` : `${approvalBasisLabel} ${fmtK(approvalBasisAmount)} ≤ ${fmtK(settings.thresholdAmount)} · no checker needed`, required: `${approvalBasisLabel} > ${fmtK(settings.thresholdAmount)} routes to Approvals` }); if (routes) approvalChecks.push(check('Approver role', true, settings.approverRole, settings.secondApprover ? 'two approvers' : 'one approver')); }
  else approvalChecks.push(skipped('Automated promotion threshold', 'Disabled in Settings → Approvals'));
  approvalChecks.push(check('Manual awards', true, 'not a manual award', 'manual awards always require approval'));
  stages.push({ id: 'approval', title: 'Approval', status: stageStatus(approvalChecks), checks: approvalChecks, summary: routes ? `Routes to Approvals · ${settings.approverRole}${settings.secondApprover ? ' · second approver' : ''}` : 'No checker required for this award', config: [['automatedApprovalThreshold', String(settings.automatedApprovalThreshold)], ['thresholdAmount', fmtK(settings.thresholdAmount)], ['secondApprover', String(settings.secondApprover)], ['approverRole', settings.approverRole]], inputs: [features.budgets ? ['promotionBudget', promo.budget === null ? '·' : fmtK(promo.budget)] : ['awardValue', fmtK(rewardAmount)], ['awardKind', 'automated']] });
  const ledgerChecks: RuleCheck[] = []; const last = qualifyingEvents[qualifyingEvents.length - 1] ?? ordered[ordered.length - 1]; const vertical = prefill.vertical ?? '·'; const provider = settings.providers.find((p) => p.code === last?.gameCode);
  ledgerChecks.push(check('Double entry balanced', true, `${fmtK(rewardAmount)} = ${fmtK(rewardAmount)}`, 'credit = debit')); ledgerChecks.push(vertical === '·' ? skipped('Vertical') : check('Vertical', true, vertical, 'required (BR-4)')); ledgerChecks.push(check('Provider code', Boolean(provider), last?.gameCode ?? '·', `one of ${settings.providers.map((p) => p.code).join(', ')}`)); ledgerChecks.push(check('Promo reference', true, promo.id, 'required (BR-4)'));
  stages.push({ id: 'ledger', title: 'Ledger posting', status: stageStatus(ledgerChecks), checks: ledgerChecks, summary: 'No funds move; recorded at award time', ledger: { lines: [{ side: 'Credit', account: 'Player wallet', amount: rewardAmount }, { side: 'Debit', account: 'Promotional expense account', amount: rewardAmount }], chips: [`Vertical · ${vertical}`, `Provider · ${last?.gameCode ?? '·'}${provider ? ` (${provider.name})` : ''}`, `Promo · ${promo.id}`] }, config: [['creditAccount', 'Player wallet'], ['debitAccount', 'Promotional expense account'], ['metadata', 'vertical, provider code, promo reference (BR-4)']], inputs: [['amount', fmtK(rewardAmount)], ['vertical', vertical], ['providerCode', last?.gameCode ?? '·'], ['promoReference', promo.id]] });
 /* Player notifications: a delivery preview, never a gate. The outcome is fixed by the stages above; this stage only PASSes (message sent) or is SKIPPED, so it cannot change `outcome` or `failedAt`. */
 const qualified = !stages.some((stage) => (stage.id === 'schedule' || stage.id === 'eligibility' || stage.id === 'trigger') && stage.status === 'FAIL');
 const awarded = qualified && rewardKind !== 'none' && rewardAmount > 0 && !stages.some((stage) => stage.id === 'reward' && stage.status === 'FAIL');
 const expiryHours = toNumber(prefill.freebetExpiryHours ?? '');
 const values: PlaceholderValues = { firstName: SAMPLE_FIRST_NAME, promoName: promo.name, amount: fmtK(rewardAmount), currency: 'ZMW', expiry: rewardKind === 'freebet' && expiryHours !== null ? fmtDateTime(lastEventAt + expiryHours * 60 * 60_000) : '·' };
 const notificationChecks: RuleCheck[] = []; const messages: DeliveredMessage[] = [];
 for (const trigger of NOTIFICATION_TRIGGERS) {
 const rule = promo.notifications[trigger]; const label = `${NOTIFICATION_TRIGGER_SHORT[trigger]} message`;
 if (!rule.enabled) { notificationChecks.push(skipped(label, 'Not enabled on this promotion')); continue; }
 const fires = trigger === 'onQualify' ? qualified : awarded;
 if (!fires) { notificationChecks.push(skipped(label, trigger === 'onQualify' ? 'Player did not qualify' : 'No award to notify')); continue; }
 const body = renderNotificationText(rule.body, values);
 messages.push({ trigger, channels: [...rule.channels], title: renderNotificationText(rule.title, values), body, smsSegments: rule.channels.includes('sms') ? smsSegments(body.length) : null });
 notificationChecks.push(check(label, true, `sent via ${notificationChannelSummary(rule.channels)}`, NOTIFICATION_TRIGGER_LABELS[trigger].toLowerCase()));
 }
 const configured = NOTIFICATION_TRIGGERS.filter((trigger) => promo.notifications[trigger].enabled);
 stages.push({ id: 'notifications', title: 'Player notifications', status: stageStatus(notificationChecks), checks: notificationChecks, messages, notes: ['Delivery only · never blocks an award'], summary: configured.length === 0 ? 'No player messages configured' : messages.length === 0 ? 'No message sent for this scenario' : `${messages.length} of ${configured.length} configured message(s) sent`, config: NOTIFICATION_TRIGGERS.map((trigger): [string, string] => { const rule = promo.notifications[trigger]; return [trigger, rule.enabled ? `${notificationChannelSummary(rule.channels)} · ${rule.title}` : 'off']; }), inputs: [['firstName', values.firstName], ['promoName', values.promoName], ['amount', values.amount], ['currency', values.currency], ['expiry', values.expiry], ['qualified', String(qualified)], ['awarded', String(awarded)]] });

  const firstFail = stages.find((stage) => stage.status === 'FAIL');
  return { outcome: firstFail ? 'FAIL' : 'PASS', failedAt: firstFail?.id ?? null, stages, reward: { amount: rewardAmount, currency: 'ZMW', kind: rewardKind, label: rewardLabel } };
}

export interface SimulationRun { id: string; createdAt: number; promoId: string; promoName: string; personaId: string; outcome: 'PASS' | 'FAIL'; failedAt: StageId | null; scenario: Scenario; }
export const RUNS_KEY = 'simulator.v1.runs'; export const MAX_RUNS = 25;
export function runId(createdAt: number): string { return `sim_${createdAt.toString(36)}`; }
export function loadRuns(): SimulationRun[] { if (typeof window === 'undefined') return []; try { const parsed: unknown = JSON.parse(window.localStorage.getItem(RUNS_KEY) ?? '[]'); return Array.isArray(parsed) ? parsed.map((run) => ({ ...run, scenario: { ...run.scenario, channel: run.scenario?.channel ?? 'app', events: run.scenario?.events ?? [] } })) as SimulationRun[] : []; } catch { return []; } }
export function saveRuns(runs: SimulationRun[]): void { if (typeof window === 'undefined') return; try { window.localStorage.setItem(RUNS_KEY, JSON.stringify(runs.slice(0, MAX_RUNS))); } catch { /* Prototype mock: storage failures are non-fatal. */ } }
export function addRun(run: SimulationRun): SimulationRun[] { const next = [run, ...loadRuns()].slice(0, MAX_RUNS); saveRuns(next); return next; }
/** Stamp and persist a run. The wall-clock read lives here (history bookkeeping), never inside simulate(). */
export function recordRun(input: Omit<SimulationRun, 'id' | 'createdAt'>): SimulationRun[] { const createdAt = Date.now(); return addRun({ ...input, id: runId(createdAt), createdAt }); }
export function clearRuns(): void { saveRuns([]); }
