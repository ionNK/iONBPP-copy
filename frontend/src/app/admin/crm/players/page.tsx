import T from '@/theme/tokens';
import { ComingSoon } from '@/components/ui';
/* Shared page-skeleton structural classes (top bar, container) */
import '../../promotions/promotions.css';

export default function PlayersPage() {
  return (
    <div className="promo-page" style={{ background: T.offWhite }}>
      {/* Page top bar: Internal Tool Shell title + subtitle */}
      <div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <h1 className="promo-title" style={{ color: T.textPrimary }}>Players</h1>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>ionix Boost</p>
        </div>
      </div>

      <div className="promo-container">
        <ComingSoon
          title="Players"
          description="A single view of every player: award history, promo participation, wallet impact, KYC status and safer-gambling flags. This is the context you need to vet before you credit."
          bullets={[
            'Full award and promo participation history per player',
            'KYC and safer-gambling indicators surfaced alongside spend',
            'Drill from any ledger or budget figure to the players behind it',
            'Built to support the vet-then-credit workflow for manual awards',
          ]}
          until="Player-level award data is available via the ledger export."
        />
      </div>
    </div>
  );
}
