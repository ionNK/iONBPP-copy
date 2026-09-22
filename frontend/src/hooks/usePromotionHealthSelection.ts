'use client';

import { useCallback, useEffect, useState } from 'react';
import { ACTIVE_PROMOTIONS, ALL_ACTIVE } from '@/lib/observability/mockPromotionHealth';
import type { PromotionHealthRange, PromotionHealthView } from '@/lib/observability/mockPromotionHealth';

export const SELECTION_KEY = 'promo-health:selection';

export interface PromotionHealthSelection {
  service: string;
  view: PromotionHealthView;
  range: PromotionHealthRange;
}

export const DEFAULT_SELECTION: PromotionHealthSelection = { service: ALL_ACTIVE, view: 'funnel', range: '24h' };

const VIEWS: PromotionHealthView[] = ['funnel', 'failure_rate', 'alerts', 'infra'];
const RANGES: PromotionHealthRange[] = ['1h', '24h', '7d'];

const isKnownService = (service: unknown): service is string =>
  service === ALL_ACTIVE || ACTIVE_PROMOTIONS.some((p) => p.slug === service);

/**
 * Coerces whatever is in storage into a valid selection. A service that is
 * not an active promotions-list entry (e.g. a promotion that has since expired) is
 * reset to `all_active`; view/range fall back to their defaults.
 */
function sanitise(raw: unknown): { selection: PromotionHealthSelection; changed: boolean } {
  const rec = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const service = isKnownService(rec.service) ? rec.service : DEFAULT_SELECTION.service;
  const view = VIEWS.includes(rec.view as PromotionHealthView) ? (rec.view as PromotionHealthView) : DEFAULT_SELECTION.view;
  const range = RANGES.includes(rec.range as PromotionHealthRange) ? (rec.range as PromotionHealthRange) : DEFAULT_SELECTION.range;
  const changed = service !== rec.service || view !== rec.view || range !== rec.range;
  return { selection: { service, view, range }, changed };
}

function write(selection: PromotionHealthSelection): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
  } catch {
    /* Prototype mock: storage failures are non-fatal. */
  }
}

/** Reads + sanitises the stored selection, writing back when it had to be corrected. */
export function loadPromotionHealthSelection(): PromotionHealthSelection {
  if (typeof window === 'undefined') return { ...DEFAULT_SELECTION };
  try {
    const raw = window.localStorage.getItem(SELECTION_KEY);
    if (raw === null) return { ...DEFAULT_SELECTION };
    const { selection, changed } = sanitise(JSON.parse(raw));
    if (changed) write(selection);
    return selection;
  } catch {
    write({ ...DEFAULT_SELECTION });
    return { ...DEFAULT_SELECTION };
  }
}

/**
 * Persistent card selection ({ service, view, range }) under
 * `promo-health:selection`. Defaults are returned during SSR and the first
 * client render; `hydrated` flips once storage has been read so consumers
 * can avoid a server/client mismatch.
 */
export function usePromotionHealthSelection() {
  const [selection, setSelection] = useState<PromotionHealthSelection>(DEFAULT_SELECTION);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only hydration from localStorage */
    setSelection(loadPromotionHealthSelection());
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<PromotionHealthSelection>) => {
    setSelection((cur) => {
      const next = sanitise({ ...cur, ...patch }).selection;
      write(next);
      return next;
    });
  }, []);

  const setService = useCallback((service: string) => update({ service }), [update]);
  const setView = useCallback((view: PromotionHealthView) => update({ view }), [update]);
  const setRange = useCallback((range: PromotionHealthRange) => update({ range }), [update]);

  return { selection, hydrated, setService, setView, setRange };
}

export default usePromotionHealthSelection;
