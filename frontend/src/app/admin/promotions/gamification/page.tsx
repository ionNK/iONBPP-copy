import T from '@/theme/tokens';
import { ComingSoon } from '@/components/ui';
/* Shared page-skeleton structural classes (top bar, container) */
import '../promotions.css';

export default function GamificationPage() {
  return (
    <div className="promo-page" style={{ background: T.offWhite }}>
      {/* Page top bar — Internal Tool Shell: title + subtitle */}
      <div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <h1 className="promo-title" style={{ color: T.textPrimary }}>Gamification</h1>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>ionix Boost</p>
        </div>
      </div>

      <div className="promo-container">
        <ComingSoon
          title="Gamification"
          description="A persistent loyalty layer — missions, levels and leaderboards that carry across promotions instead of resetting with each one."
          bullets={[
            'Player levels and progression across all promotions',
            'Recurring missions and challenges per vertical',
            'Persistent leaderboards with configurable prize schedules',
          ]}
          until="Missions and leaderboards run as individual time-boxed promotions."
        />
      </div>
    </div>
  );
}
