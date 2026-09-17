'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import T from '@/theme/tokens';
import { CoachMarks } from '@/components/ui';
import type { CoachMarkStep } from '@/components/ui';

/**
 * Onboarding state. The tour is shown on each of the first MAX_SHOWS
 * successful logins (login/page.tsx raises PENDING_KEY in sessionStorage;
 * this component consumes it on mount, so a refresh never re-shows the tour).
 * Settings → About "Replay onboarding tour" resets the record and raises the
 * same flag. The legacy boolean key is migrated on first read.
 */
export const ONBOARDING_KEY = 'onboarding.v1';
export const PENDING_KEY = 'onboarding.pendingShow';
export const MAX_SHOWS = 3;
const LEGACY_KEY = 'onboarding.v1.completed';

export interface OnboardingState {
  shownCount: number;
  dismissedForever: boolean;
}

const DEFAULT_STATE: OnboardingState = { shownCount: 0, dismissedForever: false };

/* Targets = data-tour attributes on the Sidebar items and the promotions
 * primary button. Step 5 lives on /admin/promotions only, so CoachMarks falls
 * back to a centered card elsewhere. */
const STEPS: CoachMarkStep[] = [
  {
    target: 'nav-promotions',
    title: 'All Promotions',
    body: 'Everything starts here: create, budget and track every promotion. Budget alerts warn you at 90% but never block awarding.',
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
    target: 'nav-journeys',
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
 * Reads the record, migrating the legacy boolean key: a completed/skipped
 * v1 tour counts as all shows used (shownCount: MAX_SHOWS) and the old key
 * is removed. Storage failures fall back to "all shows used" so the tour
 * never loops on a broken browser profile.
 */
export function loadOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE, shownCount: MAX_SHOWS };
  try {
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      window.localStorage.removeItem(LEGACY_KEY);
      const migrated: OnboardingState = { shownCount: legacy === 'true' ? MAX_SHOWS : 0, dismissedForever: false };
      saveOnboardingState(migrated);
      return migrated;
    }
    const raw = window.localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_STATE };
    const rec = parsed as Partial<Record<keyof OnboardingState, unknown>>;
    return {
      shownCount: typeof rec.shownCount === 'number' && Number.isFinite(rec.shownCount) ? Math.max(0, Math.floor(rec.shownCount)) : 0,
      dismissedForever: rec.dismissedForever === true,
    };
  } catch {
    return { ...DEFAULT_STATE, shownCount: MAX_SHOWS };
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
 * Opens after a successful login while shownCount < MAX_SHOWS and the user
 * has not ticked "Don't show again"; suppressed on /admin/login, which
 * overlays the shell with its own full-viewport surface.
 */
export default function FirstRunTour() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [shownCount, setShownCount] = useState(0);
  const [dismissForever, setDismissForever] = useState(false);
  const onLogin = pathname === '/admin/login';

  /* The shell layout persists across client-side navigation, so this runs on
   * mount AND on every route change: the login handler raises the flag, then
   * router.push lands on /admin/promotions where the flag is consumed. The
   * flag is left untouched while still on /admin/login. Consuming it here is
   * what makes a refresh mid-session NOT re-show the tour. */
  useEffect(() => {
    if (onLogin || !takePendingShow()) return;
    const state = loadOnboardingState();
    if (state.dismissedForever || state.shownCount >= MAX_SHOWS) return;
    const next: OnboardingState = { ...state, shownCount: state.shownCount + 1 };
    saveOnboardingState(next);
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- hydration from session/localStorage after navigation */
    setShownCount(next.shownCount);
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

  const footer = useCallback(
    ({ isLast }: { isLast: boolean }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 12, lineHeight: 1.35, color: T.textSecondary }}>
          Shown {shownCount} of {MAX_SHOWS}
        </span>
        {isLast && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, lineHeight: 1.5, color: T.textPrimary, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={dismissForever}
              onChange={(e) => toggleDismissForever(e.target.checked)}
              style={{ width: 16, height: 16, margin: 0, accentColor: T.navy }}
            />
            Don&apos;t show again
          </label>
        )}
      </div>
    ),
    [shownCount, dismissForever, toggleDismissForever],
  );

  return <CoachMarks steps={STEPS} open={open && !onLogin} onComplete={complete} footer={footer} />;
}
