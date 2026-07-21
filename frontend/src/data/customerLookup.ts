// Support-scoped customer promotion lookup data.
// Demo dataset — replace `findCustomer` with a real API call when available.
// Support agents can look up a customer by phone number or customer ID and see
// their promotion enrolments, status and outcomes (award / expiry / forfeiture).

export type PromotionOutcome = 'awarded' | 'pending' | 'expired' | 'forfeited' | 'in_progress';

export interface CustomerPromotion {
  promotionId: string;
  promotionName: string;
  market: string;
  status: 'active' | 'completed' | 'opted_out';
  outcome: PromotionOutcome;
  enrolledAt: string;
  rewardValue?: string;
  progressLabel?: string;
  note?: string;
}

export interface CustomerRecord {
  id: string;
  phone: string;
  name: string;
  market: string;
  tier: string;
  kycStatus: 'verified' | 'pending' | 'flagged';
  joinedAt: string;
  promotions: CustomerPromotion[];
}

const CUSTOMERS: CustomerRecord[] = [
  {
    id: 'CUS-100482',
    phone: '+254712345678',
    name: 'James Mwangi',
    market: 'Kenya',
    tier: 'Gold',
    kycStatus: 'verified',
    joinedAt: '2024-03-11',
    promotions: [
      {
        promotionId: 'PRM-2024-007',
        promotionName: 'Kenya Mega Jackpot Boost',
        market: 'Kenya',
        status: 'active',
        outcome: 'in_progress',
        enrolledAt: '2026-06-01',
        progressLabel: '3 of 5 qualifying bets placed',
        note: 'Needs 2 more KES 100+ bets to unlock the boost.',
      },
      {
        promotionId: 'PRM-2024-002',
        promotionName: 'Weekend Free Bet',
        market: 'Kenya',
        status: 'completed',
        outcome: 'awarded',
        enrolledAt: '2026-05-18',
        rewardValue: 'KES 200 Free Bet',
        note: 'Free bet credited and used on 2026-05-20.',
      },
      {
        promotionId: 'PRM-2024-005',
        promotionName: 'Acca Insurance',
        market: 'Kenya',
        status: 'completed',
        outcome: 'expired',
        enrolledAt: '2026-04-02',
        note: 'Qualifying window closed before conditions met.',
      },
    ],
  },
  {
    id: 'CUS-205913',
    phone: '+233201234567',
    name: 'Ama Boateng',
    market: 'Ghana',
    tier: 'Silver',
    kycStatus: 'verified',
    joinedAt: '2025-01-22',
    promotions: [
      {
        promotionId: 'PRM-2024-003',
        promotionName: 'Ghana Welcome Offer',
        market: 'Ghana',
        status: 'active',
        outcome: 'pending',
        enrolledAt: '2026-06-05',
        progressLabel: 'Awaiting first deposit match',
        note: 'Deposit made; award pending settlement of first bet.',
      },
      {
        promotionId: 'PRM-2024-009',
        promotionName: 'Free Spins Friday',
        market: 'Ghana',
        status: 'completed',
        outcome: 'forfeited',
        enrolledAt: '2026-05-10',
        note: 'Forfeited — self-exclusion triggered during promo window.',
      },
    ],
  },
  {
    id: 'CUS-330271',
    phone: '+251911223344',
    name: 'Selam Tesfaye',
    market: 'Ethiopia',
    tier: 'Bronze',
    kycStatus: 'pending',
    joinedAt: '2026-02-14',
    promotions: [
      {
        promotionId: 'PRM-2024-001',
        promotionName: 'Ethiopia Acca Insurance',
        market: 'Ethiopia',
        status: 'active',
        outcome: 'in_progress',
        enrolledAt: '2026-06-06',
        progressLabel: '1 of 4 legs settled',
        note: 'KYC pending — award will hold until verification completes.',
      },
    ],
  },
];

/** Normalise phone numbers so "+254 712..." and "0712..." both match. */
function normalizePhone(p: string): string {
  return p.replace(/[\s\-()]/g, '').replace(/^0/, '').replace(/^\+/, '');
}

/** Find a customer by exact ID (case-insensitive) or phone number. */
export function findCustomer(query: string): CustomerRecord | null {
  const q = query.trim();
  if (!q) return null;
  const idMatch = CUSTOMERS.find((c) => c.id.toLowerCase() === q.toLowerCase());
  if (idMatch) return idMatch;
  const nq = normalizePhone(q);
  if (nq.length < 5) return null;
  return CUSTOMERS.find((c) => normalizePhone(c.phone).endsWith(nq)) ?? null;
}

export const OUTCOME_META: Record<PromotionOutcome, { label: string; tone: 'success' | 'warning' | 'error' | 'info' }> = {
  awarded: { label: 'Awarded', tone: 'success' },
  in_progress: { label: 'In Progress', tone: 'info' },
  pending: { label: 'Pending', tone: 'warning' },
  expired: { label: 'Expired', tone: 'warning' },
  forfeited: { label: 'Forfeited', tone: 'error' },
};
