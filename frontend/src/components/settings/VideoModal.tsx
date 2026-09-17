'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { T } from '@/theme/tokens';
import type { TutorialVideo } from '@/data/manual';

interface VideoModalProps {
  video: TutorialVideo;
  onClose: () => void;
}

const focusableSelector = 'button:not([disabled]), [href], video[controls], [tabindex]:not([tabindex="-1"])';

export default function VideoModal({ video, onClose }: VideoModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const timer = window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>('button')?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const targets = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (!targets.length) { event.preventDefault(); return; }
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      previousFocus.current?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className="tutorial-video-modal__backdrop" role="presentation" style={{ background: T.scrim }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="tutorial-video-modal" role="dialog" aria-modal="true" aria-labelledby="tutorial-video-title" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd, boxShadow: T.shadowRaise }}>
        <div className="tutorial-video-modal__header">
          <h2 id="tutorial-video-title" style={{ color: T.textPrimary }}>{video.title}</h2>
          <button type="button" className="settings-icon-button" style={{ color: T.textSecondary, background: 'transparent', borderRadius: T.radiusSm }} aria-label="Close video" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {unavailable ? (
          <div className="tutorial-video-modal__unavailable" role="status" style={{ background: T.offWhite, borderRadius: T.radiusSm, color: T.textSecondary }}>
            This video is being produced.
          </div>
        ) : (
          <video
            className="tutorial-video-modal__media"
            style={{ background: T.navy, borderRadius: T.radiusSm }}
            controls
            poster="/assets/tutorials/poster.svg"
            onError={() => setUnavailable(true)}
          >
            {/* Browsers fire `error` on the <source> when it is the only candidate, so listen on both. */}
            <source src={`/assets/tutorials/${video.slug}.mp4`} type="video/mp4" onError={() => setUnavailable(true)} />
            This video is being produced.
          </video>
        )}
      </div>
    </div>,
    document.body,
  );
}
