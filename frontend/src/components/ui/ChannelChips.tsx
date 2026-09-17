'use client';

import T from '@/theme/tokens';
import { CHANNEL_ICONS, CHANNEL_LABELS, channelSummary } from '@/lib/promotions';
import type { Channel } from '@/lib/promotions';
import './ui.css';

export interface ChannelChipsProps {
  channels: Channel[];
  /** Collapse a complete channel set to one concise pill. */
  compact?: boolean;
}

/** Read-only channel pills for promotion tables, summaries, and previews. */
export function ChannelChips({ channels, compact = false }: ChannelChipsProps) {
  if (compact && channels.length === 4) {
    return (
      <span
        className="ui-channel-chip"
        style={{ background: T.offWhite, border: `1px solid ${T.border}`, borderRadius: T.radiusPill, color: T.textSecondary }}
      >
        {channelSummary(channels)}
      </span>
    );
  }

  return (
    <span className="ui-channel-chips" aria-label={`Channels: ${channelSummary(channels)}`}>
      {channels.map((channel) => {
        const Icon = CHANNEL_ICONS[channel];
        return (
          <span
            key={channel}
            className="ui-channel-chip"
            style={{ background: T.offWhite, border: `1px solid ${T.border}`, borderRadius: T.radiusPill, color: T.textSecondary }}
          >
            <Icon size={12} aria-hidden="true" />
            {CHANNEL_LABELS[channel]}
          </span>
        );
      })}
    </span>
  );
}

export default ChannelChips;
