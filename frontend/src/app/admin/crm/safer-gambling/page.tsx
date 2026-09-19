import T from '@/theme/tokens';
import { ComingSoon } from '@/components/ui';
/* Shared page-skeleton structural classes (top bar, container) */
import '../../promotions/promotions.css';

export default function SaferGamblingPage() {
  return (
    <div className="promo-page" style={{ background: T.offWhite }}>
      {/* Page top bar: Internal Tool Shell title + subtitle */}
      <div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <h1 className="promo-title" style={{ color: T.textPrimary }}>Safer Gambling</h1>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>ionix Boost</p>
        </div>
      </div>

      <div className="promo-container">
        <ComingSoon
          title="Safer Gambling"
          description="Safer-gambling indicators surfaced across the platform, with automatic exclusion from promotions, lifecycles and bulk uploads."
          bullets={[
            'Player-level risk flags visible in the Player 360',
            'Automatic exclusion lists applied to all award paths',
            'Exclusion checks on every bulk-upload file before crediting',
          ]}
          until="Safer-gambling checks are performed manually before campaigns."
        />
      </div>
    </div>
  );
}
