'use client';

import { Check, Info } from 'lucide-react';
import T from '@/theme/tokens';
import { Badge } from './Badge';
import './ui.css';

export interface ComingSoonProps {
  title: string;
  description: string;
  bullets: string[];
  /** Optional interim guidance — rendered as an "Until then" notice (offWhite panel + icon). */
  until?: string;
}

/** Feature teaser card for unreleased ("Soon") nav destinations — white card, Radius/Medium. */
export function ComingSoon({ title, description, bullets, until }: ComingSoonProps) {
  return (
    <section
      className="ui-coming-soon"
      style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd }}
    >
      <div className="ui-coming-soon__header">
        <h2 className="ui-coming-soon__title" style={{ color: T.textPrimary }}>{title}</h2>
        {/* Same ghost treatment as the "Pending approval" status badge. */}
        <Badge color={T.navy} ghost>Coming soon</Badge>
      </div>
      <p className="ui-coming-soon__description" style={{ color: T.textSecondary }}>{description}</p>
      <ul className="ui-coming-soon__list">
        {bullets.map((bullet) => (
          <li key={bullet} className="ui-coming-soon__item" style={{ color: T.textSecondary }}>
            <Check size={16} aria-hidden="true" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      {until && (
        <div className="ui-coming-soon__until" style={{ background: T.offWhite, borderRadius: T.radiusSm }}>
          <Info size={16} style={{ color: T.textSecondary }} aria-hidden="true" />
          <span style={{ color: T.textPrimary }}>
            <span className="ui-coming-soon__until-label">Until then:</span> {until}
          </span>
        </div>
      )}
    </section>
  );
}

export default ComingSoon;
