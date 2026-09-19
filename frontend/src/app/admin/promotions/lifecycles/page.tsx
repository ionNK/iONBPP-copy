import T from '@/theme/tokens';
import { ComingSoon } from '@/components/ui';
/* Shared page-skeleton structural classes (top bar, container) */
import '../promotions.css';

export default function JourneysPage() {
  return (
    <div className="promo-page" style={{ background: T.offWhite }}>
      {/* Page top bar: Internal Tool Shell title + subtitle */}
      <div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <h1 className="promo-title" style={{ color: T.textPrimary }}>Journeys</h1>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>ionix Boost</p>
        </div>
      </div>

      <div className="promo-container">
        <ComingSoon
          title="Journeys"
          description="Automated lifecycle flows for welcome, at-risk and reactivation journeys, triggered by real player events with an optional approval step before any award is credited."
          bullets={[
            'Trigger-based flows across the player lifecycle',
            'Every automated award posts through the same ledger and budget pipeline',
            'Optional human approval gate before crediting',
            'Reuses the same triggers and eligibility rules as promotions',
          ]}
          until="Lifecycle campaigns are run as individually scheduled promotions."
        />
      </div>
    </div>
  );
}
