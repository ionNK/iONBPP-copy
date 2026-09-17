import T from '@/theme/tokens';
import { ComingSoon } from '@/components/ui';
/* Shared page-skeleton structural classes (top bar, container) */
import '../promotions/promotions.css';

export default function AnalyticsPage() {
  return (
    <div className="promo-page" style={{ background: T.offWhite }}>
      {/* Page top bar: Internal Tool Shell title + subtitle */}
      <div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <h1 className="promo-title" style={{ color: T.textPrimary }}>Analytics</h1>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>ionix Boost</p>
        </div>
      </div>

      <div className="promo-container">
        <ComingSoon
          title="Analytics"
          description="Promo performance beyond the dashboard: spend per vertical and provider, ROI per promotion, and at-risk player cohorts."
          bullets={[
            'Promo spend broken down by vertical, provider and market',
            'ROI and uplift per promotion and per segment',
            'At-risk and churn cohort reporting',
            'Drill from any figure to the underlying awards',
          ]}
          until="Spend reporting is compiled from the ledger at period end."
        />
      </div>
    </div>
  );
}
