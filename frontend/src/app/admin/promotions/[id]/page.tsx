'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Gift, Users, Calendar, Wallet, Edit, Zap, Copy, BarChart3, User, CheckCircle2, Clock, Circle, XCircle } from 'lucide-react';
import Link from 'next/link';
import OperationalControls, { type PromoState } from '@/components/governance/OperationalControls';
import { SEED_PROMOTIONS_FROM_TEMPLATES } from '@/data/seedTemplates';

// Hardcoded seed promotions shown on the list page. Kept in sync so the detail
// page can resolve any promotion the user can click, not just localStorage ones.
const SEED_PROMOTIONS = [
  {
    id: 'PRM-2024-001',
    name: 'Ethiopia Acca Insurance',
    type: 'Cashback',
    status: 'active',
    market: 'ET',
    segment: 'Sportsbook Players',
    stats: { claims: 1240, cost: 'ETB 124,000', conversion: '12%' },
    period: 'Feb 1 - Ongoing',
  },
  {
    id: 'PRM-2024-002',
    name: 'Cashia Launch Cashback',
    type: 'Deposit Match',
    status: 'active',
    market: 'KE',
    segment: 'New Users',
    stats: { claims: 342, cost: '€3,400', conversion: '15%' },
    period: 'Feb 1 - Feb 28',
  },
  {
    id: 'PRM-2024-003',
    name: 'Super League Welcome Bonus',
    type: 'Deposit Match',
    status: 'paused',
    market: 'KE',
    segment: 'New Users',
    stats: { claims: 850, cost: '€8,500', conversion: '8%' },
    period: 'Mar 1 - Mar 31',
  },
];


// Map a free-form promotion status string to an operational control state.
function toPromoState(status: string): PromoState {
 const s = (status || '').toLowerCase();
 if (s === 'paused') return 'paused';
 if (s === 'ended' || s === 'completed' || s === 'expired') return 'ended';
 return 'active';
}


// Canonical promotion lifecycle stages, in order.
const LIFECYCLE_STAGES = ['Draft', 'Pending Approval', 'Scheduled', 'Active', 'Paused', 'Ended'] as const;

// Map a promotion status to its index in the lifecycle.
function lifecycleIndex(status: string): number {
 const s = (status || '').toLowerCase();
 if (s === 'draft') return 0;
 if (s === 'pending' || s === 'pending approval' || s === 'review') return 1;
 if (s === 'scheduled') return 2;
 if (s === 'active') return 3;
 if (s === 'paused') return 4;
 if (s === 'ended' || s === 'completed' || s === 'expired') return 5;
 return 3; // default to Active
}


function RailBar({ label, value, color }: { label: string; value: number; color: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="railbar">
      <div className="railbar-head"><span>{label}</span><b>{v}%</b></div>
      <div className="railbar-track"><div className="railbar-fill" style={{ width: `${v}%`, background: color }} /></div>
    </div>
  );
}

export default function PromotionDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [promo, setPromo] = useState<any>(null);

    useEffect(() => {
        // Find promo in local storage
        const saved = JSON.parse(localStorage.getItem('saved_promotions') || '[]');
        const found = saved.find((p: any) => String(p.id) === String(params.id));

        if (found) {
            // Merge found promo with defaults for robust rendering
            setPromo({
                segment: 'Sportsbook Players',
                rules: 'Min 6 Selections, 1 Loss, Stake > 5 ETB',
                reward: '100% - 200% Stake Back (Capped at 100k)',
 market: 'ET',
 stats: { claims: 0, cost: '-', conversion: '-' },
 period: 'Active',
 owner: { name: 'Promotions Team', role: 'Campaign Manager', email: 'promotions@betika.com' },
 approvers: [
 { name: 'Sarah Kimani', role: 'Marketing Lead', status: 'approved', date: 'Feb 1, 2024' },
 { name: 'David Otieno', role: 'Compliance', status: 'approved', date: 'Feb 1, 2024' },
 { name: 'Finance Control', role: 'Budget Sign-off', status: 'pending', date: null },
 ],
 lifecycleHistory: [],
 ...found,
 });

        } else {
            // Fallback for demo if ID doesn't match perfectly or direct link
            if (params.id === 'PRM-2024-001') {
                setPromo({
                    id: 'PRM-2024-001',
                    name: 'Ethiopia Acca Insurance',
                    type: 'Cashback',
                    status: 'active',
                    market: 'ET',
                    segment: 'Sportsbook Players',
                    rules: 'Min 6 Selections, 1 Loss, Stake > 5 ETB',
                    reward: '100% - 200% Stake Back (Capped at 100k)',
                    period: 'Feb 1 - Ongoing'
                });
            }
        }
    }, [params.id]);

    if (!promo) return <div className="p-12 text-center text-muted">Loading promotion details...</div>;

 return (
 <div className="promotion-details-page">
 <button onClick={() => router.back()} className="back-btn"><ArrowLeft size={16} /> Back to List</button>

 {/* ===== HERO ===== */}
 <div className="hero glass-panel">
 <div className="avatar">{promo.name.charAt(0)}</div>
 <div className="hero-meta">
 <h1>{promo.name}</h1>
 <p className="sub">ID: {promo.id} · {promo.type}</p>
 <div className="badges">
 <span className={`status-badge ${promo.status.toLowerCase()}`}>{promo.status}</span>
 <span className="badge">{promo.type || 'Promotion'}</span>
 <span className="badge">{promo.market === 'ET' ? '🇪🇹 Ethiopia' : '🇰🇪 Kenya'}</span>
 <span className="badge">{promo.segment}</span>
 </div>
 </div>
 <div className="hero-stats">
 <div className="stat"><span>Total Claims</span><b className="claims">{promo.stats?.claims || 0}</b></div>
 <div className="stat"><span>Total Cost</span><b className="cost">{promo.stats?.cost || '-'}</b></div>
 <div className="stat"><span>Duration</span><b className="dur">{promo.period}</b></div>
 </div>
 </div>

 {/* ===== ACTIONS ===== */}
 <div className="actions">
 <Link href={`/admin/promotions/create?edit=${promo.id}`} className="act primary"><Edit size={14} /> Edit Configuration</Link>
 <button><Zap size={14} /> Boost Reach</button>
 <button><Copy size={14} /> Duplicate</button>
 <button><BarChart3 size={14} /> View Report</button>
 <OperationalControls
 promotionId={promo.id}
 promotionName={promo.name}
 market={promo.market === 'ET' ? 'Ethiopia' : promo.market === 'KE' ? 'Kenya' : (promo.market || 'Kenya')}
 state={toPromoState(promo.status)}
 onStateChange={(next) =>
 setPromo((prev: any) => ({ ...prev, status: next }))
 }
 />
 </div>


            <div className="details-grid">
                {/* Main Info */}
                <div className="glass-panel main-panel">
                    <h3 className="panel-title">Configuration Summary</h3>

                    <div className="summary-section">
                        <h4>Targeting</h4>
                        <div className="data-row">
                            <span className="label">Audience Segment</span>
                            <span className="value">{promo.segment}</span>
                        </div>
                        <div className="data-row">
                            <span className="label">Markets</span>
                            <span className="value">{promo.market === 'ET' ? '🇪🇹 Ethiopia' : '🇰🇪 Kenya (Default)'}</span>
                        </div>
                    </div>

                    <div className="divider" />

                    <div className="summary-section">
                        <h4>Mechanics</h4>
                        <div className="rule-box">
                            {promo.name.includes('Acca') ? (
                                <>
                                    <div className="rule-line">IF <span className="text-cyan">Selections ≥ 6</span></div>
                                    <div className="rule-line">AND <span className="text-purple">Losing Selections = 1</span></div>
                                    <div className="rule-line">AND <span className="text-yellow">Stake ≥ 5 ETB</span></div>
                                </>
                            ) : (
                                <>
                                    <div className="rule-line">IF <span className="text-cyan">Deposit {'>'} 100</span></div>
                                    <div className="rule-line">AND <span className="text-purple">Is First Deposit = True</span></div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="divider" />

                    <div className="summary-section">
                        <h4>Rewards</h4>
                        <div className="reward-card">
                            <Gift size={20} className="text-yellow" />
                            <div>
                                <div className="reward-title">{promo.reward || 'Tiered Cashback'}</div>
                                <div className="reward-sub text-muted">{promo.name.includes('Acca') ? 'Max Cap: 100,000 ETB' : 'Standard Wager x35'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="divider" />

                    <div className="summary-section">
                        <h4>Creative & Legal</h4>
                        {promo.bannerImage && (
                            <div className="banner-preview mb-4">
                                <img src={promo.bannerImage} alt="Promotion Banner" className="w-full rounded-lg" />
                            </div>
                        )}
                        <div className="tnc-box">
                            <h5>Terms & Conditions</h5>
                            <p>{promo.termsAndConditions || 'Standard promotional terms apply.'}</p>
                        </div>
                    </div>

                </div>

 {/* ===== RIGHT RAIL ===== */}
 <aside className="rail">
 <div className="glass-panel rail-card">
 <h4>Performance</h4>
 <RailBar label="Conversion rate" value={promo.stats?.conversion && promo.stats.conversion !== '-' ? Number(String(promo.stats.conversion).replace('%', '')) : 42} color="#699951" />
 <RailBar label="Engagement" value={68} color="#38bdf8" />
 <RailBar label="Budget utilisation" value={35} color="#facc15" />
 <RailBar label="Abuse risk" value={18} color="#fb923c" />
 </div>

 <div className="glass-panel rail-card">
 <h4>Key metrics</h4>
 <ul className="metrics">
 <li><span><Users size={13} /> Total Claims</span><b>{promo.stats?.claims || 0}</b></li>
 <li><span><Wallet size={13} /> Total Cost</span><b>{promo.stats?.cost || '-'}</b></li>
 <li><span><Calendar size={13} /> Duration</span><b>{promo.period}</b></li>
 </ul>
 </div>

 <div className="glass-panel rail-card">
 <h4>Lifecycle State</h4>
 <ol className="lifecycle">
 {LIFECYCLE_STAGES.map((stage, i) => {
 const current = lifecycleIndex(promo.status);
 const state = i < current ? 'done' : i === current ? 'current' : 'todo';
 const Icon = state === 'done' ? CheckCircle2 : state === 'current' ? Clock : Circle;
 return (
 <li key={stage} className={`lc-step ${state}`}>
 <span className="lc-icon"><Icon size={15} /></span>
 <span className="lc-label">{stage}</span>
 {state === 'current' && <span className="lc-tag">Current</span>}
 </li>
 );
 })}
 </ol>
 </div>

 <div className="glass-panel rail-card">
 <h4>Owner</h4>
 <div className="owner">
 <div className="owner-avatar">{(promo.owner?.name || 'P').charAt(0)}</div>
 <div className="owner-info">
 <b>{promo.owner?.name || 'Promotions Team'}</b>
 <span>{promo.owner?.role || 'Campaign Manager'}</span>
 {promo.owner?.email && <a href={`mailto:${promo.owner.email}`} className="owner-email">{promo.owner.email}</a>}
 </div>
 </div>
 </div>

 <div className="glass-panel rail-card">
 <h4>Approvers</h4>
 <ul className="approvers">
 {(promo.approvers || []).map((a: any, i: number) => (
 <li key={i} className="approver">
 <span className="ap-avatar"><User size={13} /></span>
 <span className="ap-info">
 <b>{a.name}</b>
 <span>{a.role}{a.date ? ` · ${a.date}` : ''}</span>
 </span>
 <span className={`ap-status ${a.status}`}>
 {a.status === 'approved' ? <CheckCircle2 size={13} /> : a.status === 'rejected' ? <XCircle size={13} /> : <Clock size={13} />}
 {a.status}
 </span>
 </li>
 ))}
 {(!promo.approvers || promo.approvers.length === 0) && (
 <p className="muted">No approvers assigned.</p>
 )}
 </ul>
 </div>

 <div className="glass-panel rail-card">
 <h4>Status</h4>
 <p className="muted">This promotion is <b className="status-emphasis">{promo.status}</b> and targeting <b>{promo.segment}</b> in {promo.market === 'ET' ? 'Ethiopia' : 'Kenya'}.</p>
 </div>
 </aside>

 </div>

        </div>
    );
}
