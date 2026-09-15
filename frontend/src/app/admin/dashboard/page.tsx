import T from '@/theme/tokens';
import { ZambiaFlag } from '@/components/ui';
/* Shared page-skeleton structural classes (top bar, container, empty state) */
import '../promotions/promotions.css';

export default function DashboardPage() {
  return (
    <div
      className="promo-page"
      style={{ background: T.offWhite, fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Top bar */}
      <div
        className="promo-topbar"
        style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}
      >
        <div>
          <div className="promo-title-row">
            <h1 className="promo-title" style={{ color: T.textPrimary }}>Dashboard</h1>
            <ZambiaFlag />
          </div>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>
            ionix Boost
          </p>
        </div>
      </div>

      <div className="promo-container">
        <div
          style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}
        >
          <div className="promo-empty">
            <p className="promo-empty__title" style={{ color: T.textPrimary }}>
              Dashboard coming soon
            </p>
            <p className="promo-empty__body" style={{ color: T.textSecondary }}>
              Promotions metrics will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
