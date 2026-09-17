'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import T from '@/theme/tokens';
import { ChannelChips, PrimaryButton } from '@/components/ui';
import type { Channel } from '@/lib/promotions';

const customerPreview = {
  background: T.navy,
  text: T.white,
  secondary: T.white,
  border: T.white,
  ctaBackground: T.yellow,
  ctaText: T.navy,
} as const;

type PreviewMode = 'mobile' | 'desktop';

export interface ContentPreviewProps {
  title?: string;
  shortDescription?: string;
  bannerUrl?: string;
  bannerAlt?: string;
  ctaLabel?: string;
  terms?: string;
  type?: string;
  market?: string;
channels?: Channel[];
  readOnly?: boolean;
}

function TermsContent({ terms }: { terms?: string }) {
  const blocks = (terms || '').trim().split(/\n\s*\n/).filter(Boolean);

  if (blocks.length === 0) {
    return <p className="content-preview__terms-empty">Terms will appear here.</p>;
  }

  return (
    <div className="content-preview__terms-copy">
      {blocks.map((block, index) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const isList = lines.every((line) => /^(-|1\.)\s+/.test(line));
        if (isList) {
          const ordered = lines.every((line) => /^1\.\s+/.test(line));
          const List = ordered ? 'ol' : 'ul';
          return <List key={`${block}-${index}`}>{lines.map((line) => <li key={line}>{line.replace(/^(-|1\.)\s+/, '')}</li>)}</List>;
        }
        return <p key={`${block}-${index}`}>{lines.join(' ')}</p>;
      })}
    </div>
  );
}

export function ContentPreview({
  title,
  shortDescription,
  bannerUrl,
  bannerAlt,
  ctaLabel,
  terms,
  type,
  market,
channels,
  readOnly = false,
}: ContentPreviewProps) {
  const [mode, setMode] = useState<PreviewMode>('mobile');
  const [termsOpen, setTermsOpen] = useState(false);
  const frameClass = mode === 'mobile' ? 'content-preview__frame--mobile' : 'content-preview__frame--desktop';

  return (
    <section className="content-preview" aria-label="Promotion content preview">
      <div className="content-preview__header">
        <h3 className="content-preview__heading" style={{ color: T.textPrimary }}>Preview</h3>
        {!readOnly && (
          <div className="promo-segmented" role="group" aria-label="Preview device" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusPill }}>
            {(['mobile', 'desktop'] as const).map((option) => {
              const active = mode === option;
              return (
                <button
                  key={option}
                  type="button"
                  className="promo-segmented__button"
                  aria-pressed={active}
                  onClick={() => setMode(option)}
                  style={{ background: active ? T.navy : 'transparent', color: active ? T.white : T.textSecondary, borderRadius: T.radiusPill }}
                >
                  {option === 'mobile' ? 'Mobile' : 'Desktop'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={`content-preview__frame ${frameClass}`} style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusMd, boxShadow: T.shadowRaise }}>
        {mode === 'desktop' && (
          <div className="content-preview__browser-bar" style={{ borderBottom: `1px solid ${T.border}`, background: T.offWhite }}>
            {[0, 1, 2].map((dot) => <span key={dot} className="content-preview__browser-dot" style={{ background: T.textSecondary }} />)}
          </div>
        )}
        <div className="content-preview__surface" style={{ background: customerPreview.background, color: customerPreview.text }}>
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview must not be optimized
            <img className="content-preview__banner" src={bannerUrl} alt={bannerAlt || ''} />
          ) : (
            <div className="content-preview__banner-placeholder" style={{ border: `1px dashed ${customerPreview.border}`, color: customerPreview.secondary }}>
              Banner will appear here
            </div>
          )}
          <div className="content-preview__body">
            {(type || market) && <span className="content-preview__badge" style={{ border: `1px solid ${customerPreview.border}`, color: customerPreview.text }}>{[type, market].filter(Boolean).join(' · ')}</span>}
            {channels && channels.length > 0 && <ChannelChips channels={channels} compact />}
<h4 className="content-preview__title" style={{ color: customerPreview.text }}>{title?.trim() || 'Promotion title'}</h4>
            <p className="content-preview__description" style={{ color: customerPreview.secondary }}>{shortDescription || 'Short description will appear here.'}</p>
            <div className="content-preview__cta"><PrimaryButton onClick={() => undefined}>{ctaLabel || 'Opt in'}</PrimaryButton></div>
            <button
              type="button"
              className="content-preview__terms-trigger"
              aria-expanded={termsOpen}
              onClick={() => setTermsOpen((open) => !open)}
              style={{ borderTop: `1px solid ${customerPreview.border}`, color: customerPreview.text }}
            >
              Terms &amp; conditions <ChevronDown size={16} className={termsOpen ? 'content-preview__chevron--open' : undefined} />
            </button>
            {termsOpen && <div className="content-preview__terms" style={{ color: customerPreview.secondary }}><TermsContent terms={terms} /></div>}
          </div>
        </div>
      </div>
      <p className="content-preview__note" style={{ color: T.textSecondary }}>Preview is indicative. Final rendering depends on the customer app.</p>
    </section>
  );
}

export default ContentPreview;
