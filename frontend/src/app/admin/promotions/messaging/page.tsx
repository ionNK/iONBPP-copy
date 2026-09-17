import T from '@/theme/tokens';
import { ComingSoon } from '@/components/ui';
/* Shared page-skeleton structural classes (top bar, container) */
import '../promotions.css';

export default function MessagingPage() {
  return (
    <div className="promo-page" style={{ background: T.offWhite }}>
      {/* Page top bar: Internal Tool Shell title + subtitle */}
      <div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <h1 className="promo-title" style={{ color: T.textPrimary }}>Messaging</h1>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>ionix Boost</p>
        </div>
      </div>

      <div className="promo-container">
        <ComingSoon
          title="Messaging"
          description="Tell players about their awards with SMS, push and in-app messages orchestrated from the same journeys and segments."
          bullets={[
            'SMS-first channel support for the Zambian market',
            'Messages triggered by award, journey and lifecycle events',
            'Segment-targeted broadcasts with per-market templates',
          ]}
          until="Player communications are sent outside the platform."
        />
      </div>
    </div>
  );
}
