import T from '@/theme/tokens';
import { ComingSoon } from '@/components/ui';
/* Shared page-skeleton structural classes (top bar, container) */
import '../../promotions/promotions.css';

export default function VipPage() {
  return (
    <div className="promo-page" style={{ background: T.offWhite }}>
      {/* Page top bar — Internal Tool Shell: title + subtitle */}
      <div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <h1 className="promo-title" style={{ color: T.textPrimary }}>VIP</h1>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>ionix Boost</p>
        </div>
      </div>

      <div className="promo-container">
        <ComingSoon
          title="VIP"
          description="Tiering and manual-touch workflows for high-value players, with maker-checker controls on every discretionary award."
          bullets={[
            'Configurable VIP tiers with entry and maintenance criteria',
            'Host assignment and contact history per player',
            'Discretionary awards routed through the standard approval flow',
          ]}
          until="High-value players are managed manually by the country teams."
        />
      </div>
    </div>
  );
}
