/**
 * Shared promotions mock store.
 *
 * The promotions list (/admin/promotions) and the New Promotion flow
 * (/admin/promotions/new) are separate routes, so the mock data lives in
 * localStorage (key `promo_list_v1`) with the seed below as the default.
 * Both routes read through `loadPromotions`; mutations go through
 * `savePromotions` / `addPromotion`.
 */

import { AppWindow, Globe, Hash, Smartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PromoStatus = 'active' | 'scheduled' | 'expired' | 'draft' | 'pending';

/* ------------------------------------------------------------------ */
/* Channels: the surfaces a player can qualify through.                */
/* ------------------------------------------------------------------ */

export const CHANNELS = ['web', 'mobile', 'app', 'ussd'] as const;
export type Channel = typeof CHANNELS[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  web: 'Web',
  mobile: 'Mobile web',
  app: 'App',
  ussd: 'USSD',
};

export const CHANNEL_ICONS: Record<Channel, LucideIcon> = {
  web: Globe,
  mobile: Smartphone,
  app: AppWindow,
  ussd: Hash,
};

/** Fresh copy of every channel (callers may mutate their own array). */
export const allChannels = (): Channel[] => [...CHANNELS];

export const isChannel = (value: unknown): value is Channel =>
  typeof value === 'string' && (CHANNELS as readonly string[]).includes(value);

/**
 * Migration: rows persisted before the channels field existed carry no
 * `channels` key and are treated as enabled on all four. Unknown values are
 * dropped; an empty or absent list also resolves to all four.
 */
export function normalizeChannels(value: unknown): Channel[] {
  if (!Array.isArray(value)) return allChannels();
  const valid = CHANNELS.filter((channel) => value.includes(channel));
  return valid.length > 0 ? valid : allChannels();
}

/** "All channels" when every channel is enabled, otherwise the enabled labels in canonical order. */
export function channelSummary(channels: Channel[]): string {
  const enabled = CHANNELS.filter((channel) => channels.includes(channel));
  if (enabled.length === CHANNELS.length) return 'All channels';
  return enabled.map((channel) => CHANNEL_LABELS[channel]).join(', ');
}

/* ------------------------------------------------------------------ */
/* Player notifications: optional messages on qualify and on award.    */
/* ------------------------------------------------------------------ */

/* SMS first: it is the only channel released so far; the rest are listed disabled (TBC). */
export const NOTIFICATION_CHANNELS = ['sms', 'push', 'email', 'inapp'] as const;
export type NotificationChannel = typeof NOTIFICATION_CHANNELS[number];

/** Channels that can currently be selected. Others render disabled and are dropped on load. */
export const AVAILABLE_NOTIFICATION_CHANNELS: readonly NotificationChannel[] = ['sms'];

export const isNotificationChannelAvailable = (channel: NotificationChannel): boolean =>
 AVAILABLE_NOTIFICATION_CHANNELS.includes(channel);

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  push: 'Push',
  sms: 'SMS',
  email: 'Email',
  inapp: 'In-app',
};

export interface NotificationRule {
  enabled: boolean;
  channels: NotificationChannel[];
  title: string;
  body: string;
}

export interface Notifications {
  onQualify: NotificationRule;
  onAward: NotificationRule;
}

export type NotificationTrigger = keyof Notifications;

export const NOTIFICATION_TRIGGERS: readonly NotificationTrigger[] = ['onQualify', 'onAward'];

export const NOTIFICATION_TRIGGER_LABELS: Record<NotificationTrigger, string> = {
  onQualify: 'When a player qualifies',
  onAward: 'When a player is awarded',
};

/** Short trigger names for list tooltips and simulator rows. */
export const NOTIFICATION_TRIGGER_SHORT: Record<NotificationTrigger, string> = {
  onQualify: 'Qualify',
  onAward: 'Award',
};

export const DEFAULT_NOTIFICATION_CHANNELS: readonly NotificationChannel[] = ['sms'];

export const isNotificationChannel = (value: unknown): value is NotificationChannel =>
  typeof value === 'string' && (NOTIFICATION_CHANNELS as readonly string[]).includes(value);

/** Default rule: disabled, SMS preselected, no copy. */
export function defaultNotificationRule(): NotificationRule {
  return { enabled: false, channels: [...DEFAULT_NOTIFICATION_CHANNELS], title: '', body: '' };
}

/** Migration default: both rules disabled (used for rows/drafts with no notifications key). */
export function defaultNotifications(): Notifications {
  return { onQualify: defaultNotificationRule(), onAward: defaultNotificationRule() };
}

/** Wizard default for a brand-new draft: award message on, qualify message off. */
export function defaultDraftNotifications(): Notifications {
  return { onQualify: defaultNotificationRule(), onAward: { ...defaultNotificationRule(), enabled: true } };
}

export function cloneNotifications(notifications: Notifications): Notifications {
  return {
    onQualify: { ...notifications.onQualify, channels: [...notifications.onQualify.channels] },
    onAward: { ...notifications.onAward, channels: [...notifications.onAward.channels] },
  };
}

/**
 * Migration: a missing or invalid rule is the disabled default. Unknown and not-yet-available
 * channels are dropped; an explicit empty list is preserved so the wizard can
 * surface it, while an absent list falls back to the default channels.
 */
export function normalizeNotificationRule(value: unknown): NotificationRule {
  if (!value || typeof value !== 'object') return defaultNotificationRule();
  const rule = value as Partial<NotificationRule>;
  const rawChannels = rule.channels;
  return {
    enabled: rule.enabled === true,
    channels: Array.isArray(rawChannels)
      ? NOTIFICATION_CHANNELS.filter((channel) => rawChannels.includes(channel) && isNotificationChannelAvailable(channel))
      : [...DEFAULT_NOTIFICATION_CHANNELS],
    title: typeof rule.title === 'string' ? rule.title : '',
    body: typeof rule.body === 'string' ? rule.body : '',
  };
}

/** Rows and drafts persisted before notifications existed carry no key: both rules disabled. */
export function normalizeNotifications(value: unknown): Notifications {
  if (!value || typeof value !== 'object') return defaultNotifications();
  const notifications = value as Partial<Notifications>;
  return {
    onQualify: normalizeNotificationRule(notifications.onQualify),
    onAward: normalizeNotificationRule(notifications.onAward),
  };
}

export function enabledNotificationTriggers(notifications: Notifications): NotificationTrigger[] {
  return NOTIFICATION_TRIGGERS.filter((trigger) => notifications[trigger].enabled);
}

export function hasNotifications(notifications: Notifications): boolean {
  return enabledNotificationTriggers(notifications).length > 0;
}

/** Selected notification channels in canonical order, e.g. "SMS, Push". */
export function notificationChannelSummary(channels: NotificationChannel[]): string {
  const labels = NOTIFICATION_CHANNELS.filter((channel) => channels.includes(channel)).map((channel) => NOTIFICATION_CHANNEL_LABELS[channel]);
  return labels.length > 0 ? labels.join(', ') : 'No channels';
}

/* Placeholders: {{token}} substituted at send time (sample values in previews). */
export const NOTIFICATION_PLACEHOLDERS = ['firstName', 'promoName', 'amount', 'currency', 'expiry'] as const;
export type NotificationPlaceholder = typeof NOTIFICATION_PLACEHOLDERS[number];
export type PlaceholderValues = Record<NotificationPlaceholder, string>;

export const placeholderToken = (placeholder: NotificationPlaceholder): string => `{{${placeholder}}}`;

/** Replaces known {{placeholders}}; unknown tokens are left as typed. */
export function renderNotificationText(text: string, values: PlaceholderValues): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
    (NOTIFICATION_PLACEHOLDERS as readonly string[]).includes(key) ? values[key as NotificationPlaceholder] : match,
  );
}

/** Single GSM SMS segment length; longer messages split into more segments. */
export const SMS_SEGMENT_LENGTH = 160;

export function smsSegments(length: number): number {
  return Math.max(1, Math.ceil(length / SMS_SEGMENT_LENGTH));
}

/* Seed copy, shared by the seed rows below and the wizard templates so the
 * list, the simulator and a template-based draft all carry the same text. */
export const MONEY_BACK_NOTIFICATIONS: Notifications = {
  onQualify: {
    enabled: true,
    channels: ['sms'],
    title: 'Money Back is on its way',
    body: 'Hi {{firstName}}, your multibet missed by one leg, so {{promoName}} has you covered. Your cashback will be credited by 14:00 tomorrow.',
  },
  onAward: {
    enabled: true,
    channels: ['sms'],
    title: 'Your Money Back has landed',
    body: 'Hi {{firstName}}, {{amount}} from {{promoName}} is now in your wallet. Good luck on your next bet!',
  },
};

export const AVIATOR_WELCOME_NOTIFICATIONS: Notifications = {
  onQualify: {
    enabled: true,
    channels: ['sms'],
    title: 'Day complete, freebets coming',
    body: 'Nice one {{firstName}}! You placed 10 qualifying Aviator bets today. Your {{promoName}} freebets land tomorrow at 14:00.',
  },
  onAward: {
    enabled: true,
    channels: ['sms'],
    title: 'Your Aviator freebets are here',
    body: '{{firstName}}, {{amount}} in freebets from {{promoName}} is ready. Play Aviator before {{expiry}}.',
  },
};

export interface Promo {
id: string;
name: string;
type: string;
market: string;
schedule: string;
budget: number | null;
spend: number | null;
status: PromoStatus;
channels: Channel[];
/** Player messages on qualify and on award; both disabled unless configured. */
notifications: Notifications;
/**
 * Product vertical (one of PRODUCT_VERTICALS in @/data/promotion-templates).
 * Carried from the wizard's Step 1 "Product vertical" select; `null` when
 * the promotion is cross-product or was persisted before the field existed.
 */
vertical: string | null;
/**
 * PLACEHOLDER — provider code (Settings → Provider codes, e.g. "SPR").
 * The wizard has no provider field yet, so rows created through the wizard
 * are always `null`; only the seed rows below carry sample codes so the
 * list's Provider facet has something to filter on.
 */
providerCode: string | null;
}

/** Non-empty string or `null`; used for the vertical / providerCode migrations. */
export function normalizeOptionalText(value: unknown): string | null {
return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/* Two seeds are channel-specific so the list, simulator and preview have a
 * restricted example: PR-001 (app + mobile web) and PR-013 (USSD only).
 * Every other seed is enabled on all four channels.
 *
 * PLACEHOLDER DATA: `vertical` and `providerCode` are sample values assigned
 * to give the list's Vertical column and Vertical / Provider facets realistic
 * content. Provider codes mirror PROVIDER_SEED in @/lib/settings (SPR Spribe,
 * SMS SmartSoft, IMN iMoon, SBK Sportsbook). Cross-product seeds (PR-006,
 * PR-009) carry `null` for both. */
const PROMO_SEED_BASE = [
{ id: 'PR-001', name: 'Aviator Welcome Offer', type: 'Freebet · Welcome', market: 'Zambia', schedule: '01 Sep – ongoing', budget: 50000, spend: 31200, status: 'active', channels: ['app', 'mobile'], notifications: AVIATOR_WELCOME_NOTIFICATIONS, vertical: 'Aviator', providerCode: 'SPR' },
{ id: 'PR-002', name: 'Money Back (Sportsbook Cashback)', type: 'Cashback · Multibet', market: 'Zambia', schedule: '01 Sep – ongoing', budget: 120000, spend: 118400, status: 'active', channels: allChannels(), notifications: MONEY_BACK_NOTIFICATIONS, vertical: 'Sportsbook', providerCode: 'SBK' },
/* Experiment arm B of PR-002 (see @/lib/experiments/mockExperiments EXP-001): same type, vertical,
 * provider and copy so the two arms differ only in the award configuration under test. */
{ id: 'PR-002-B', name: 'Money Back (Sportsbook Cashback) B', type: 'Cashback · Multibet', market: 'Zambia', schedule: '01 Sep – ongoing', budget: 120000, spend: 64900, status: 'active', channels: allChannels(), notifications: MONEY_BACK_NOTIFICATIONS, vertical: 'Sportsbook', providerCode: 'SBK' },

{ id: 'PR-003', name: 'Aviator Challenges', type: 'Leaderboard', market: 'Zambia', schedule: '15 Sep – 30 Sep', budget: 100000, spend: 0, status: 'scheduled', channels: allChannels(), vertical: 'Aviator', providerCode: 'SPR' },
{ id: 'PR-004', name: 'Weekend Acca Boost', type: 'Odds Boost', market: 'Zambia', schedule: 'Draft', budget: null, spend: null, status: 'draft', channels: allChannels(), vertical: 'Sportsbook', providerCode: 'SBK' },
{ id: 'PR-005', name: 'August Crash Missions', type: 'Missions', market: 'Zambia', schedule: '01 Aug – 31 Aug', budget: 80000, spend: 74100, status: 'expired', channels: allChannels(), vertical: 'Crash', providerCode: 'IMN' },
{ id: 'PR-006', name: 'First Deposit Boost', type: 'Deposit Match', market: 'Zambia', schedule: '01 Sep – 31 Oct', budget: 60000, spend: 12400, status: 'active', channels: allChannels(), vertical: null, providerCode: null },
{ id: 'PR-007', name: 'Midweek Free Spins', type: 'Free Spins', market: 'Zambia', schedule: '10 Sep – ongoing', budget: 25000, spend: 23100, status: 'active', channels: allChannels(), vertical: 'Casino', providerCode: 'SMS' },
{ id: 'PR-008', name: 'Rain Bonus · Lusaka', type: 'Freebet · Rain', market: 'Zambia', schedule: '20 Sep – 30 Sep', budget: 15000, spend: 0, status: 'scheduled', channels: allChannels(), vertical: 'Sportsbook', providerCode: 'SBK' },
{ id: 'PR-009', name: 'Referral Reload', type: 'Referral', market: 'Zambia', schedule: 'Draft', budget: null, spend: null, status: 'draft', channels: allChannels(), vertical: null, providerCode: null },
{ id: 'PR-010', name: 'Jackpot Happy Hour', type: 'Jackpot', market: 'Zambia', schedule: '01 Jul – 31 Jul', budget: 40000, spend: 38750, status: 'expired', channels: allChannels(), vertical: 'Casino', providerCode: 'SMS' },
{ id: 'PR-011', name: 'Cashout Insurance', type: 'Cashback · Bet Insurance', market: 'Zambia', schedule: '01 Sep – ongoing', budget: 75000, spend: 40200, status: 'active', channels: allChannels(), vertical: 'Sportsbook', providerCode: 'SBK' },
{ id: 'PR-012', name: 'National Day Special', type: 'Freebet · Event', market: 'Zambia', schedule: '24 Oct – 25 Oct', budget: 30000, spend: 0, status: 'scheduled', channels: allChannels(), vertical: 'Sportsbook', providerCode: 'SBK' },
{ id: 'PR-013', name: 'USSD Onboarding Offer', type: 'Freebet · Welcome', market: 'Zambia', schedule: '15 Jun – 15 Aug', budget: 20000, spend: 19800, status: 'expired', channels: ['ussd'], vertical: 'Sportsbook', providerCode: 'SBK' },
] as const satisfies readonly (Omit<Promo, 'notifications'> & { notifications?: Notifications })[];

/**
 * Seed rows as the list, simulator and dashboard consume them. Rows without
 * seed copy carry the disabled default; the two with copy get their own clone
 * so nothing shares (or mutates) the template constants.
 */
export const PROMO_SEED: Promo[] = PROMO_SEED_BASE.map((promo) => ({
 ...promo,
 channels: [...promo.channels],
 notifications: normalizeNotifications('notifications' in promo ? promo.notifications : undefined),
}));

/* ------------------------------------------------------------------ */
/* Schedule: `Promo.schedule` is a display string in one of three shapes */
/*   "01 Sep – ongoing" / "15 Sep – 30 Sep" (seed, day-month, year 2026)  */
/*   "2026-09-01 – 2026-10-31" (wizard, ISO)                              */
/*   "Draft" (no schedule yet)                                            */
/* The list needs structured start / end for its Schedule column, date-  */
/* range facet and default sort, so this parses the string once here.    */
/* ------------------------------------------------------------------ */

/** Seed schedules carry no year; they describe the current reporting year (see @/lib/dashboard). */
const SCHEDULE_YEAR = 2026;
const SCHEDULE_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export interface ParsedSchedule {
/** UTC midnight of the first day; `null` when the promotion has no schedule (Draft). */
start: number | null;
/** UTC midnight of the last day; `null` when ongoing or unscheduled. */
end: number | null;
/** True when the schedule has a start but no end date. */
ongoing: boolean;
}

function parseScheduleToken(token: string): number | null {
const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(token);
if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
const dayMonth = /^(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?$/.exec(token);
if (!dayMonth) return null;
const month = SCHEDULE_MONTHS.indexOf(dayMonth[2].toLowerCase());
if (month < 0) return null;
return Date.UTC(dayMonth[3] ? Number(dayMonth[3]) : SCHEDULE_YEAR, month, Number(dayMonth[1]));
}

export function parseSchedule(schedule: string): ParsedSchedule {
const [startToken = '', endToken = ''] = schedule.split(/\s[–-]\s/);
const start = parseScheduleToken(startToken.trim());
const ongoing = start !== null && endToken.trim().toLowerCase() === 'ongoing';
const end = ongoing ? null : parseScheduleToken(endToken.trim());
return { start, end, ongoing };
}

/** "01 Sep 2026" — list-column date format (Settings default DD MMM YYYY). */
export function formatScheduleDate(ms: number): string {
const d = new Date(ms);
const month = SCHEDULE_MONTHS[d.getUTCMonth()];
return `${String(d.getUTCDate()).padStart(2, '0')} ${month.charAt(0).toUpperCase()}${month.slice(1)} ${d.getUTCFullYear()}`;
}

/** True when the promotion's window overlaps [from, to] (inclusive, UTC midnights). Unscheduled rows never match. */
export function scheduleOverlaps(schedule: string, from: number, to: number): boolean {
const { start, end } = parseSchedule(schedule);
if (start === null) return false;
if (start > to) return false;
return end === null || end >= from;
}

/**
 * Default list order: Active rows first, then everything else, each group
 * by start date descending (newest first). Unscheduled rows (Draft) sink to
 * the bottom of their group; ties keep the incoming (insertion) order.
 */
export function sortPromotionsDefault(list: Promo[]): Promo[] {
return list
.map((promo, index) => ({ promo, index, start: parseSchedule(promo.schedule).start }))
.sort((a, b) => {
const activeDelta = Number(b.promo.status === 'active') - Number(a.promo.status === 'active');
if (activeDelta !== 0) return activeDelta;
const aStart = a.start ?? Number.NEGATIVE_INFINITY;
const bStart = b.start ?? Number.NEGATIVE_INFINITY;
if (aStart !== bStart) return bStart - aStart;
return a.index - b.index;
})
.map(({ promo }) => promo);
}

const LIST_KEY = 'promo_list_v1';
const NOTICE_KEY = 'promo_notice_v1';

/**
 * Reads `promo_list_v1`. Rows persisted before the channels field existed
 * are migrated on load: a missing, empty or invalid `channels` becomes all four.
 * A missing `vertical` or `providerCode` becomes `null`. A legacy `betTiming`
 * key, if present, is carried through untouched and ignored.
 */
export function loadPromotions(): Promo[] {
if (typeof window === 'undefined') return PROMO_SEED;
try {
const raw = window.localStorage.getItem(LIST_KEY);
if (!raw) return PROMO_SEED;
const parsed: unknown = JSON.parse(raw);
if (!Array.isArray(parsed)) return PROMO_SEED;
return (parsed as Array<Omit<Promo, 'channels' | 'notifications' | 'vertical' | 'providerCode'> & { channels?: unknown; notifications?: unknown; vertical?: unknown; providerCode?: unknown }>).map((promo) => ({
...promo,
channels: normalizeChannels(promo.channels),
notifications: normalizeNotifications(promo.notifications),
vertical: normalizeOptionalText(promo.vertical),
providerCode: normalizeOptionalText(promo.providerCode),
}));
} catch {
return PROMO_SEED;
}
}

export function savePromotions(list: Promo[]): void {
try {
window.localStorage.setItem(LIST_KEY, JSON.stringify(list));
} catch {
/* Prototype mock: storage quota failures are non-fatal. */
}
}

/** Prepends a promotion so newly created rows surface at the top of the list. */
export function addPromotion(promo: Promo): void {
savePromotions([promo, ...loadPromotions()]);
}

/**
 * Replaces the row with the same id in place (keeping its list position), or
 * prepends it when absent. Used by the wizard's Save draft so re-saving a
 * draft — including a seeded one such as PR-004 — never duplicates its row.
 */
export function upsertPromotion(promo: Promo): void {
const list = loadPromotions();
const index = list.findIndex((p) => p.id === promo.id);
if (index === -1) {
savePromotions([promo, ...list]);
return;
}
savePromotions(list.map((p, i) => (i === index ? promo : p)));
}

/** Next promotion ID: "PR-" + zero-padded next number from the mock data. */
export function nextPromoId(): string {
const max = loadPromotions().reduce((m, p) => {
const n = parseInt(p.id.replace(/^PR-/, ''), 10);
return Number.isFinite(n) ? Math.max(m, n) : m;
}, 0);
return `PR-${String(max + 1).padStart(3, '0')}`;
}

/** One-shot success notice shown on the list after routing back from a flow. */
export function setListNotice(message: string): void {
try {
window.sessionStorage.setItem(NOTICE_KEY, message);
} catch {
/* non-fatal */
}
}

export function consumeListNotice(): string | null {
try {
const message = window.sessionStorage.getItem(NOTICE_KEY);
if (message) window.sessionStorage.removeItem(NOTICE_KEY);
return message;
} catch {
return null;
}
}
