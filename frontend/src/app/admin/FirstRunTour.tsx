'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CoachMarks } from '@/components/ui';
import type { CoachMarkStep } from '@/components/ui';

/** First-run flag: completing OR skipping sets "true". Never cleared by the app. */
const STORAGE_KEY = 'onboarding.v1.completed';

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

function hasCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return true;
  }
}

function markCompleted(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    /* Prototype mock: storage failures are non-fatal. */
  }
}

/**
 * First-run onboarding: mounted once in the admin shell (app/admin/layout.tsx).
 * Opens on the first authenticated load only; suppressed on /admin/login,
 * which overlays the shell with its own full-viewport surface.
 */
export default function FirstRunTour() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only hydration from localStorage */
    setOpen(!hasCompleted());
  }, []);

  const complete = useCallback(() => {
    markCompleted();
    setOpen(false);
  }, []);

  const onLogin = pathname === '/admin/login';

  return <CoachMarks steps={STEPS} open={open && !onLogin} onComplete={complete} />;
}
