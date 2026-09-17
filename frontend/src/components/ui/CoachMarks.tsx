'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import T from '@/theme/tokens';
import { GhostButton } from './GhostButton';
import { PrimaryButton } from './PrimaryButton';
import './ui.css';

export interface CoachMarkStep {
  /** Matches `[data-tour="<target>"]` in the DOM. Missing target → centered fallback card. */
  target: string;
  title: string;
  body: string;
}

export interface CoachMarksProps {
  steps: CoachMarkStep[];
  open: boolean;
  /** Fired on Done, Skip tour, Escape and scrim click. */
  onComplete: () => void;
}

type Rect = { top: number; left: number; width: number; height: number };

/* Spacer-scale constants (Unity: 4 / 12 / 16). */
const CARD_WIDTH = 360;
const HIGHLIGHT_PAD = 4;
const CARD_GAP = 12;
const VIEWPORT_MARGIN = 16;

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

function measure(target: string): Rect | null {
  if (typeof document === 'undefined') return null;
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/**
 * Card placement: prefer the right of the target (sidebar items), then
 * below, then above; clamped to the viewport. Card height is read from the
 * rendered element so vertical clamping is exact.
 */
function place(anchor: Rect, cardHeight: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_WIDTH, vw - VIEWPORT_MARGIN * 2);
  const gap = HIGHLIGHT_PAD + CARD_GAP;

  let top: number;
  let left: number;

  if (anchor.left + anchor.width + gap + width <= vw - VIEWPORT_MARGIN) {
    left = anchor.left + anchor.width + gap;
    top = anchor.top;
  } else if (anchor.top + anchor.height + gap + cardHeight <= vh - VIEWPORT_MARGIN) {
    left = anchor.left + anchor.width - width;
    top = anchor.top + anchor.height + gap;
  } else {
    left = anchor.left + anchor.width - width;
    top = anchor.top - gap - cardHeight;
  }

  return {
    top: clamp(top, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, vh - cardHeight - VIEWPORT_MARGIN)),
    left: clamp(left, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, vw - width - VIEWPORT_MARGIN)),
    width,
  };
}

/**
 * Step-by-step coach marks: scrim + one card anchored to a `[data-tour]`
 * element (spotlight via box-shadow, no SVG masking). Rendered through a
 * portal on document.body so it sits above the TopBar/Sidebar shell.
 * Escape / scrim click = skip; focus moves into the card on every step.
 */
export function CoachMarks({ steps, open, onComplete }: CoachMarksProps) {
  const [index, setIndex] = useState(0);
  const [anchor, setAnchor] = useState<Rect | null>(null);
  const [cardHeight, setCardHeight] = useState(0);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const total = steps.length;
  const step = steps[index];
  const isLast = index === total - 1;

  /* Portal target only exists on the client. */
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- client-only portal gate */
    setMounted(true);
  }, []);

  /* Restart from step 1 whenever the tour is (re)opened. */
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- reset on open */
    if (open) setIndex(0);
  }, [open]);

  /* Measure the target for the current step; recompute on resize/scroll. */
  const remeasure = useCallback(() => {
    if (!step) return;
    setAnchor(measure(step.target));
    if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
  }, [step]);

  useLayoutEffect(() => {
    if (!open || !mounted) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- DOM measurement (getBoundingClientRect) must follow layout */
    remeasure();
    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', remeasure, true);
    return () => {
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('scroll', remeasure, true);
    };
  }, [open, mounted, remeasure]);

  /* Focus moves into the card on each step; Escape skips. */
  useEffect(() => {
    if (!open || !mounted) return;
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, mounted, index, onComplete]);

  if (!open || !mounted || !step) return null;

  const cardPos = anchor && cardHeight ? place(anchor, cardHeight) : null;
  const titleId = 'ui-coach-marks-title';
  const bodyId = 'ui-coach-marks-body';

  return createPortal(
    <div className="ui-coach-marks" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId}>
      {/* Scrim: transparent click-catcher when spotlighting (the highlight's
          box-shadow paints the dim); solid T.scrim for the centered fallback. */}
      <div
        className="ui-coach-marks__scrim"
        style={{ background: anchor ? 'transparent' : T.scrim }}
        onClick={onComplete}
        aria-hidden="true"
      />

      {anchor && (
        <div
          className="ui-coach-marks__highlight"
          style={{
            top: anchor.top - HIGHLIGHT_PAD,
            left: anchor.left - HIGHLIGHT_PAD,
            width: anchor.width + HIGHLIGHT_PAD * 2,
            height: anchor.height + HIGHLIGHT_PAD * 2,
            borderRadius: T.radiusSm,
            /* ghostBorder ring + oversized spread paints the scrim around the cutout. */
            boxShadow: `0 0 0 2px ${T.ghostBorder}, 0 0 0 9999px ${T.scrim}`,
          }}
          aria-hidden="true"
        />
      )}

      <div
        ref={cardRef}
        tabIndex={-1}
        className={`ui-coach-marks__card${cardPos ? '' : ' ui-coach-marks__card--centered'}`}
        style={{
          ...(cardPos ? { top: cardPos.top, left: cardPos.left, width: cardPos.width } : {}),
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: T.radiusMd,
          boxShadow: T.shadowRaise,
        }}
      >
        <div className="ui-coach-marks__counter" style={{ color: T.textSecondary }}>
          {index + 1} of {total}
        </div>
        <h2 id={titleId} className="ui-coach-marks__title" style={{ color: T.textPrimary }}>
          {step.title}
        </h2>
        <p id={bodyId} className="ui-coach-marks__body" style={{ color: T.textSecondary }}>
          {step.body}
        </p>
        <div className="ui-coach-marks__actions">
          <GhostButton small onClick={onComplete}>Skip tour</GhostButton>
          <div className="ui-coach-marks__nav">
            {index > 0 && (
              <GhostButton small onClick={() => setIndex((i) => i - 1)}>Back</GhostButton>
            )}
            <PrimaryButton onClick={() => (isLast ? onComplete() : setIndex((i) => i + 1))}>
              {isLast ? 'Done' : 'Next'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default CoachMarks;
