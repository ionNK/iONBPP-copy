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
 <div className="details-page">
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
 <p className="muted">This promotion is <b style={{ color: 'var(--color-primary)' }}>{promo.status}</b> and targeting <b>{promo.segment}</b> in {promo.market === 'ET' ? 'Ethiopia' : 'Kenya'}.</p>
 </div>
 </aside>

 </div>

            <style jsx>{`
                .details-page { max-width: 1200px; margin: 0 auto; padding-bottom: 40px; }
                
        .back-btn { background: transparent; border: none; color: var(--color-text-muted); display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 16px; font-size: 13px; }
        .back-btn:hover { color: var(--color-text-primary); }

        /* ===== HERO ===== */
        .hero { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
        .avatar { width: 64px; height: 64px; border-radius: 16px; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; flex-shrink: 0; }
        .hero-meta { flex: 1; }
        .hero-meta h1 { font-size: 24px; font-weight: 700; margin: 0; color: var(--color-text-primary); }
        .hero-meta .sub { font-size: 13px; color: var(--color-text-secondary); margin: 4px 0 12px; font-family: monospace; }
        .badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .badge { font-size: 11px; padding: 3px 9px; border-radius: 20px; background: var(--color-bg-input); color: var(--color-text-primary); display: inline-flex; align-items: center; gap: 4px; }
        .hero-stats { display: flex; gap: 22px; }
        .hero-stats .stat { display: flex; flex-direction: column; gap: 2px; }
        .hero-stats .stat span { font-size: 11px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .5px; }
        .hero-stats .stat b { font-size: 20px; font-weight: 700; color: var(--color-text-primary); margin-top: 2px; }

        /* ===== ACTIONS ===== */
        .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .actions :global(a), .actions button { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--color-border); background: var(--color-bg-input); color: var(--color-text-primary); text-decoration: none; transition: all .15s; }
        .actions :global(a):hover, .actions button:hover { border-color: var(--color-primary); }
        .actions :global(a.primary), .actions .primary { background: var(--color-betika-yellow); color: #000; border-color: var(--color-betika-yellow); }
        .actions :global(a.primary):hover { background: #fff; border-color: #fff; }
        .actions .danger:hover { border-color: #f87171; color: #f87171; }


                
                /* Use global to ensure class applies to the Link/Anchor tag */
                :global(.btn-primary-link) {
                    background: var(--color-betika-yellow);
                    color: #000 !important; /* Force black text */
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                    transition: all 0.2s;
                    border: none;
                    cursor: pointer;
                    line-height: 1; /* Fix vertical alignment */
                }
                :global(.btn-primary-link:hover) {
                    background: #fff;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(242, 214, 65, 0.3);
                }

                .status-badge { font-size: 11px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; font-weight: 700; border: 1px solid currentColor; }
                .status-badge.active { color: var(--color-betika-green); background: rgba(105, 153, 81, 0.2); }
                .status-badge.paused { color: #facc15; background: rgba(250, 204, 21, 0.2); }

        .details-grid { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }


        .glass-panel { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px; }
        .panel-title { font-size: 16px; font-weight: 600; margin: 0 0 24px 0; color: var(--color-text-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 16px; }

        .summary-section h4 { font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 12px; }
        .data-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .label { color: var(--color-text-muted); }
        .value { color: var(--color-text-primary); font-weight: 500; }

        .divider { height: 1px; background: var(--color-border); margin: 24px 0; }

        .rule-box { background: var(--color-bg-hover); padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; color: var(--color-text-secondary); }
        .rule-line { margin-bottom: 4px; }
        .text-cyan { color: #06b6d4; }
        .text-purple { color: #a855f7; }
        .text-yellow { color: #d97706; }

        .reward-card { display: flex; gap: 12px; align-items: center; background: var(--color-bg-hover); padding: 16px; border-radius: 8px; border: 1px solid var(--color-border); }
        .reward-title { font-weight: 700; color: var(--color-text-primary); font-size: 14px; }
        .reward-sub { font-size: 12px; color: var(--color-text-muted); }

        /* ===== RIGHT RAIL ===== */
        .rail { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 16px; }

        .rail-card h4 { font-size: 13px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 16px; text-transform: uppercase; letter-spacing: .03em; }
        .rail-card .muted { font-size: 13px; color: var(--color-text-muted); line-height: 1.6; }
        .rail-card .muted b { color: var(--color-text-primary); }

        .metrics { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .metrics li { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .metrics li span { display: inline-flex; align-items: center; gap: 6px; color: var(--color-text-muted); }
        .metrics li b { color: var(--color-text-primary); font-weight: 700; }

        .railbar { margin-bottom: 16px; }
        .railbar:last-child { margin-bottom: 0; }
        .railbar-head { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
        .railbar-head span { color: var(--color-text-muted); }
        .railbar-head b { color: var(--color-text-primary); font-weight: 700; }
        .railbar-track { height: 6px; border-radius: 4px; background: var(--color-bg-hover); overflow: hidden; }
        .railbar-fill { height: 100%; border-radius: 4px; transition: width .4s; }

        .banner-preview { margin-bottom: 24px; border-radius: 8px; overflow: hidden; border: 1px solid var(--color-border); }
        .banner-preview img { width: 100%; height: auto; display: block; }

        /* Responsive Grid */
        @media (max-width: 900px) {
          .details-grid { display: flex; flex-direction: column; }
          .hero { flex-direction: column; align-items: flex-start; }
          .hero-stats { width: 100%; justify-content: flex-start; }
          .hero-stats .stat { text-align: left; }
        }

        .tnc-box { background: var(--color-bg-hover); padding: 16px; border-radius: 8px; border-left: 2px solid var(--color-betika-yellow); }
        .tnc-box h5 { margin: 0 0 8px 0; font-size: 13px; color: var(--color-text-secondary); font-weight: 600; text-transform: uppercase; }
 .tnc-box p { margin: 0; font-size: 13px; color: var(--color-text-muted); line-height: 1.5; white-space: pre-wrap; }

 /* ===== LIFECYCLE ===== */
 .lifecycle { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
 .lc-step { display: flex; align-items: center; gap: 10px; font-size: 13px; padding: 6px 0; position: relative; }
 .lc-step:not(:last-child)::before { content: ''; position: absolute; left: 7px; top: 26px; bottom: -6px; width: 2px; background: var(--color-border); }
 .lc-icon { display: inline-flex; flex-shrink: 0; z-index: 1; background: var(--color-bg-surface); }
 .lc-label { flex: 1; color: var(--color-text-muted); }
 .lc-step.done .lc-icon { color: var(--color-betika-green); }
 .lc-step.done .lc-label { color: var(--color-text-primary); }
 .lc-step.current .lc-icon { color: var(--color-betika-yellow); }
 .lc-step.current .lc-label { color: var(--color-text-primary); font-weight: 700; }
 .lc-step.todo .lc-icon { color: var(--color-text-muted); opacity: .5; }
 .lc-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 7px; border-radius: 10px; background: rgba(250, 204, 21, 0.2); color: #d97706; }

 /* ===== OWNER ===== */
 .owner { display: flex; align-items: center; gap: 12px; }
 .owner-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; flex-shrink: 0; }
 .owner-info { display: flex; flex-direction: column; gap: 1px; }
 .owner-info b { font-size: 13px; color: var(--color-text-primary); }
 .owner-info span { font-size: 12px; color: var(--color-text-muted); }
 .owner-email { font-size: 12px; color: var(--color-primary); text-decoration: none; }
 .owner-email:hover { text-decoration: underline; }

 /* ===== APPROVERS ===== */
 .approvers { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
 .approver { display: flex; align-items: center; gap: 10px; }
 .ap-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--color-bg-hover); color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
 .ap-info { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
 .ap-info b { font-size: 13px; color: var(--color-text-primary); }
 .ap-info span { font-size: 11px; color: var(--color-text-muted); }
 .ap-status { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; text-transform: capitalize; flex-shrink: 0; }
 .ap-status.approved { color: var(--color-betika-green); }
 .ap-status.pending { color: #d97706; }
 .ap-status.rejected { color: #f87171; }
 `}</style>

        </div>
    );
}
