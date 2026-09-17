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
}

/* Two seeds are channel-specific so the list, simulator and preview have a
 * restricted example: PR-001 (app + mobile web) and PR-013 (USSD only).
 * Every other seed is enabled on all four channels. */
export const PROMO_SEED: Promo[] = [
{ id: 'PR-001', name: 'Aviator Welcome Offer', type: 'Freebet · Welcome', market: 'Zambia', schedule: '01 Sep – ongoing', budget: 50000, spend: 31200, status: 'active', channels: ['app', 'mobile'] },
{ id: 'PR-002', name: 'Money Back (Sportsbook Cashback)', type: 'Cashback · Multibet', market: 'Zambia', schedule: '01 Sep – ongoing', budget: 120000, spend: 118400, status: 'active', channels: allChannels() },
{ id: 'PR-003', name: 'Aviator Challenges', type: 'Leaderboard', market: 'Zambia', schedule: '15 Sep – 30 Sep', budget: 100000, spend: 0, status: 'scheduled', channels: allChannels() },
{ id: 'PR-004', name: 'Weekend Acca Boost', type: 'Odds Boost', market: 'Zambia', schedule: 'Draft', budget: null, spend: null, status: 'draft', channels: allChannels() },
{ id: 'PR-005', name: 'August Crash Missions', type: 'Missions', market: 'Zambia', schedule: '01 Aug – 31 Aug', budget: 80000, spend: 74100, status: 'expired', channels: allChannels() },
{ id: 'PR-006', name: 'First Deposit Boost', type: 'Deposit Match', market: 'Zambia', schedule: '01 Sep – 31 Oct', budget: 60000, spend: 12400, status: 'active', channels: allChannels() },
{ id: 'PR-007', name: 'Midweek Free Spins', type: 'Free Spins', market: 'Zambia', schedule: '10 Sep – ongoing', budget: 25000, spend: 23100, status: 'active', channels: allChannels() },
{ id: 'PR-008', name: 'Rain Bonus · Lusaka', type: 'Freebet · Rain', market: 'Zambia', schedule: '20 Sep – 30 Sep', budget: 15000, spend: 0, status: 'scheduled', channels: allChannels() },
{ id: 'PR-009', name: 'Referral Reload', type: 'Referral', market: 'Zambia', schedule: 'Draft', budget: null, spend: null, status: 'draft', channels: allChannels() },
{ id: 'PR-010', name: 'Jackpot Happy Hour', type: 'Jackpot', market: 'Zambia', schedule: '01 Jul – 31 Jul', budget: 40000, spend: 38750, status: 'expired', channels: allChannels() },
{ id: 'PR-011', name: 'Cashout Insurance', type: 'Cashback · Bet Insurance', market: 'Zambia', schedule: '01 Sep – ongoing', budget: 75000, spend: 40200, status: 'active', channels: allChannels() },
{ id: 'PR-012', name: 'National Day Special', type: 'Freebet · Event', market: 'Zambia', schedule: '24 Oct – 25 Oct', budget: 30000, spend: 0, status: 'scheduled', channels: allChannels() },
{ id: 'PR-013', name: 'USSD Onboarding Offer', type: 'Freebet · Welcome', market: 'Zambia', schedule: '15 Jun – 15 Aug', budget: 20000, spend: 19800, status: 'expired', channels: ['ussd'] },
];

const LIST_KEY = 'promo_list_v1';
const NOTICE_KEY = 'promo_notice_v1';

/**
 * Reads `promo_list_v1`. Rows persisted before the channels field existed
 * are migrated on load: a missing, empty or invalid `channels` becomes all four.
 */
export function loadPromotions(): Promo[] {
if (typeof window === 'undefined') return PROMO_SEED;
try {
const raw = window.localStorage.getItem(LIST_KEY);
if (!raw) return PROMO_SEED;
const parsed: unknown = JSON.parse(raw);
if (!Array.isArray(parsed)) return PROMO_SEED;
return (parsed as Array<Omit<Promo, 'channels'> & { channels?: unknown }>).map((promo) => ({
...promo,
channels: normalizeChannels(promo.channels),
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
