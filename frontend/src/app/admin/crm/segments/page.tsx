import T from '@/theme/tokens';
import { ComingSoon } from '@/components/ui';
/* Shared page-skeleton structural classes (top bar, container) */
import '../../promotions/promotions.css';

export default function SegmentsPage() {
  return (
    <div className="promo-page" style={{ background: T.offWhite }}>
      {/* Page top bar — Internal Tool Shell: title + subtitle */}
      <div className="promo-topbar" style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <h1 className="promo-title" style={{ color: T.textPrimary }}>Segments</h1>
          <p className="promo-subtitle" style={{ color: T.textSecondary }}>ionix Boost</p>
        </div>
      </div>

      <div className="promo-container">
        <ComingSoon
          title="Segments"
          description="Group players by behaviour, value or lifecycle stage, and use those groups as promo eligibility and bulk-upload target lists."
          bullets={[
            'Behavioural and value-based segmentation (deposit frequency, vertical preference, lifecycle stage)',
            'Reusable segments as eligibility criteria in any promotion',
            'Export a segment directly as a bulk-upload list',
            'Automatic exclusion lists for safer-gambling and KYC holds',
          ]}
          until="Target lists are compiled manually by the gaming team for bulk upload."
        />
      </div>
    </div>
  );
}
