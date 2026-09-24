'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Checkbox, CoachMarks } from '@/components/ui';
import type { CoachMarkStep } from '@/components/ui';
import { features } from '@/config/features';

/**
 * Onboarding state. The tour is shown after EVERY successful login
 * (login/page.tsx raises PENDING_KEY in sessionStorage; this component
 * consumes it on mount, so a refresh never re-shows the tour) until the user
 * ticks "Don't show again" on the final step. Settings → About "Replay
 * onboarding tour" clears that opt-out and raises the same flag. Legacy keys
 * (boolean completed flag, v1 record with a show counter) are migrated on
 * first read: only `dismissedForever` is kept.
 */
export const ONBOARDING_KEY = 'onboarding.v2';
export const PENDING_KEY = 'onboarding.pendingShow';
const LEGACY_KEYS = ['onboarding.v1.completed', 'onboarding.v1'];

export interface OnboardingState {
  dismissedForever: boolean;
}

const DEFAULT_STATE: OnboardingState = { dismissedForever: false };

/* Targets = data-tour attributes on the Sidebar items and the promotions
 * primary button. Step 5 lives on /admin/promotions only, so CoachMarks falls
 * back to a centered card elsewhere. */
const STEPS: CoachMarkStep[] = [
  {
    target: 'nav-promotions',
    title: 'All Promotions',
    body: features.budgets
      ? 'Everything starts here: create, budget and track every promotion. Budget alerts warn you at 90% but never block awarding.'
      : 'Everything starts here: create, schedule and track every promotion, then submit it for checker approval.',
  },
  {
    target: 'nav-bulk-upload',
    title: 'Bulk Upload',
    body: 'Upload a vetted CSV to credit players in bulk. Every award posts to the ledger with full metadata.',
  },
  {
    target: 'nav-approvals',
    title: 'Approvals',
    body: 'Maker-checker: awards and changes wait here for a second pair of eyes before anything is credited.',
  },
  {
    target: 'nav-lifecycles',
    title: 'On the roadmap',
    body: 'Items marked "TBC" are planned. Click any of them to see what they will do and how to work in the meantime.',
  },
  {
    target: 'new-promotion',
    title: 'Ready?',
    body: 'Create your first promotion.',
  },
];

export function saveOnboardingState(state: OnboardingState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  } catch {
    /* Prototype mock: storage failures are non-fatal. */
  }
}

/**
 * Reads the record. Legacy keys are removed on first read; a v1 record's
 * `dismissedForever` carries over, its show counter is dropped (the tour no
 * longer has a cap). Storage failures fall back to "opted out" so the tour
 * never loops on a broken browser profile.
 */
export function loadOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') return { dismissedForever: true };
  try {
    let migrated: OnboardingState | null = null;
    for (const key of LEGACY_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy === null) continue;
      window.localStorage.removeItem(key);
      if (key === 'onboarding.v1') {
        try {
          const rec: unknown = JSON.parse(legacy);
          if (typeof rec === 'object' && rec !== null && (rec as { dismissedForever?: unknown }).dismissedForever === true) {
            migrated = { dismissedForever: true };
          }
        } catch {
          /* Unreadable legacy record: start fresh. */
        }
      }
    }
    if (migrated) {
      saveOnboardingState(migrated);
      return migrated;
    }
    const raw = window.localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_STATE };
    const rec = parsed as Partial<Record<keyof OnboardingState, unknown>>;
    return { dismissedForever: rec.dismissedForever === true };
  } catch {
    return { dismissedForever: true };
  }
}

/** Raised by the login success handler and by Settings → About "Replay". */
export function requestOnboardingShow(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(PENDING_KEY, '1');
  } catch {
    /* Prototype mock: storage failures are non-fatal. */
  }
}

/** Consumes the session flag; returns whether it was set. */
function takePendingShow(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const pending = window.sessionStorage.getItem(PENDING_KEY) === '1';
    if (pending) window.sessionStorage.removeItem(PENDING_KEY);
    return pending;
  } catch {
    return false;
  }
}

/**
 * Onboarding tour: mounted once in the admin shell (app/admin/layout.tsx).
 * Opens after every successful login unless the user has ticked "Don't show
 * again"; suppressed on /admin/login, which overlays the shell with its own
 * full-viewport surface.
 */
export default function FirstRunTour() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dismissForever, setDismissForever] = useState(false);
  const onLogin = pathname === '/admin/login';

  /* The shell layout persists across client-side navigation, so this runs on
   * mount AND on every route change: the login handler raises the flag, then
   * router.push lands on /admin/promotions where the flag is consumed. The
   * flag is left untouched while still on /admin/login. Consuming it here is
   * what makes a refresh mid-session NOT re-show the tour. */
  useEffect(() => {
    if (onLogin || !takePendingShow()) return;
    if (loadOnboardingState().dismissedForever) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- hydration from session/localStorage after navigation */
    setDismissForever(false);
    setOpen(true);
  }, [onLogin]);

  /* Done, Skip tour, Escape and scrim click all close. */
  const complete = useCallback(() => setOpen(false), []);

  /* Final-step checkbox: persists immediately so Escape / scrim close honour it too. */
  const toggleDismissForever = useCallback((checked: boolean) => {
    setDismissForever(checked);
    saveOnboardingState({ ...loadOnboardingState(), dismissedForever: checked });
  }, []);

  /* Final step only: the opt-out. The tour otherwise returns after every login. */
  const footer = useCallback(
    ({ isLast }: { isLast: boolean }) =>
      isLast ? (
        <Checkbox
          checked={dismissForever}
          onChange={toggleDismissForever}
          label="Don't show again"
        />
      ) : null,
    [dismissForever, toggleDismissForever],
  );

  return <CoachMarks steps={STEPS} open={open && !onLogin} onComplete={complete} footer={footer} />;
}
