'use client';
import { useRewards, TIERS, REWARD_ITEMS } from '@/context/RewardsContext';
import { 
  Trophy, 
  Search, 
  History, 
  Zap, 
  ShieldCheck, 
  Crown, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ChevronRight,
  Info,
  Star,
  Gift,
  Lock,
  Loader2,
  X,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { useState, useMemo } from 'react';

export default function RewardsHubPage() {
  const { 
    points, 
    currentTier, 
    pointsToNextTier, 
    transactionHistory, 
    redeemReward,
    activeRewards 
  } = useRewards();

  const [filterType, setFilterType] = useState<string>('all');
  const [selectedReward, setSelectedReward] = useState<typeof REWARD_ITEMS[0] | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState<string | null>(null);

  const currentTierData = useMemo(() => TIERS.find(t => t.name === currentTier)!, [currentTier]);
  
  const filteredRewards = useMemo(() => {
    return REWARD_ITEMS.filter(item => filterType === 'all' || item.type === filterType);
  }, [filterType]);

  const progressPercentage = useMemo(() => {
    const nextTier = TIERS[TIERS.indexOf(currentTierData) + 1];
    if (!nextTier) return 100;
    const range = nextTier.minPoints - (currentTierData.minPoints || 0);
    const progress = points - currentTierData.minPoints;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  }, [points, currentTierData]);

  const handleRedeem = (reward: typeof REWARD_ITEMS[0]) => {
     setSelectedReward(reward);
     setRedemptionSuccess(null);
  };

  const confirmRedemption = async () => {
    if (!selectedReward) return;
    setIsRedeeming(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1200));
    const result = redeemReward(selectedReward.id);
    setIsRedeeming(false);
    if (result.success) {
       setRedemptionSuccess(selectedReward.name);
       // Close after delay
       setTimeout(() => {
          setSelectedReward(null);
          setRedemptionSuccess(null);
       }, 2000);
    } else {
       alert(result.message);
    }
  };

  return (
    <div className="rewards-hub-container">
      {/* Hero Section */}
      <section className="rewards-hero">
        <div className="hero-content-grid">
           <div className="hero-player-info">
              <div className="player-badge">
                 <div className="avatar-initials">NS</div>
                 <div className="badge-details">
                    <span className="welcome">Welcome back,</span>
                    <h2 className="player-name">Nana Sarpong</h2>
                 </div>
              </div>
              <div className="tier-progress-card">
                 <div className="tp-head">
                    <div className="cur-tier">
                       <Trophy size={20} color="var(--color-betika-yellow)" />
                       <span>{currentTier} Member</span>
                    </div>
                    <span className="pts-count"><strong>{points.toLocaleString()}</strong> Reward Pts</span>
                 </div>
                 <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                 </div>
                 <div className="tp-footer">
                    <span>{pointsToNextTier > 0 ? `${pointsToNextTier.toLocaleString()} pts to ${TIERS[TIERS.indexOf(currentTierData)+1]?.name}` : 'Highest Tier Achieved'}</span>
                    <span className="expiry"><Clock size={12} /> Pts expire in 84 days</span>
                 </div>
              </div>
           </div>

           <div className="hero-quick-stats">
              <div className="stat-card">
                 <Zap size={24} color="var(--color-betika-yellow)" className="icon-pulse" />
                 <div className="stat-val">{currentTierData.multiplier}x</div>
                 <div className="stat-lbl">Point Multiplier</div>
              </div>
              <div className="stat-card">
                 <ShieldCheck size={24} color="var(--color-betika-green)" />
                 <div className="stat-val">{activeRewards.length}</div>
                 <div className="stat-lbl">Active Rewards</div>
              </div>
              <div className="stat-card action-card">
                 <Star size={24} color="var(--color-betika-yellow)" />
                 <div className="stat-lbl">Loyalty Since 2024</div>
              </div>
           </div>
        </div>
      </section>

      {/* Tier Ladder Section */}
      <section className="tier-ladder-section">
         <div className="section-header">
            <h3 className="section-title"><Star size={20} fill="var(--color-betika-yellow)" /> Loyalty Tier Benefits</h3>
            <p className="section-desc">Climb the tiers to unlock higher multipliers and exclusive rewards.</p>
         </div>
         <div className="tier-ladder-row">
            {TIERS.map((tier, idx) => {
               const isCurrent = tier.name === currentTier;
               const isLocked = points < tier.minPoints;
               const currentTierIdx = TIERS.findIndex(t => t.name === currentTier);
               const isReached = idx <= currentTierIdx;

               return (
                  <div key={tier.name} className={`tier-node ${isCurrent ? 'active' : ''} ${!isReached ? 'locked' : ''}`}>
                     <div className="tier-icon">{idx + 1}</div>
                     <h4 className="tier-name">{tier.name}</h4>
                     <p className="tier-range">{tier.minPoints.toLocaleString()}+ pts</p>
                     <ul className="tier-perks">
                        <li><Zap size={10} /> {tier.multiplier}x Multiplier</li>
                        {tier.benefits.map((b, i) => <li key={i}><CheckCircle2 size={10}/> {b}</li>)}
                     </ul>
                     {isCurrent && <div className="current-marker">You are here</div>}
                  </div>
               )
            })}
         </div>
      </section>

      <div className="main-rewards-grid">
         {/* Redemption Store */}
         <div className="redemption-area">
            <div className="store-header">
               <div className="header-text">
                  <h3 className="section-title"><Gift size={20} /> Redemption Store</h3>
                  <p className="section-desc">Spend your accumulated points on bonuses and boosts.</p>
               </div>
               <div className="store-filters">
                  {['all', 'free_bet', 'bonus', 'odds_boost'].map(t => (
                    <button 
                        key={t}
                        className={filterType === t ? 'active' : ''} 
                        onClick={() => setFilterType(t)}
                    >
                        {t === 'all' ? 'All' : t.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
               </div>
            </div>

            <div className="rewards-grid">
               {filteredRewards.map((item) => {
                  const isAffordable = points >= item.pointPrice;
                  const currentTierIdx = TIERS.findIndex(t => t.name === currentTier);
                  const minTierIdx = TIERS.findIndex(t => t.name === item.minTier);
                  const isLockedByTier = currentTierIdx < minTierIdx;

                  return (
                     <div key={item.id} className={`reward-card ${!isAffordable ? 'unaffordable' : ''} ${isLockedByTier ? 'tier-locked' : ''}`}>
                        {isLockedByTier && (
                           <div className="locked-overlay">
                              <Lock size={32} />
                              <span>{item.minTier} Required</span>
                           </div>
                        )}
                        <div className="reward-badge-type">{item.type.replace('_', ' ').toUpperCase()}</div>
                        <h4 className="reward-name">{item.name}</h4>
                        <p className="reward-desc">{item.description}</p>
                        <div className="reward-footer">
                           <div className="price-tag">
                              <span className="price">{item.pointPrice.toLocaleString()}</span>
                              <span className="lbl">PTS</span>
                           </div>
                           <button 
                             className="redeem-btn" 
                             disabled={!isAffordable || isLockedByTier}
                             onClick={() => handleRedeem(item)}
                           >
                              Redeem Now
                           </button>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

         {/* Sidebar Transactions */}
         <aside className="rewards-sidebar">
            <div className="sidebar-header">
               <h3 className="section-title"><History size={18} /> Points History</h3>
            </div>
            <div className="transaction-list">
               {transactionHistory.length === 0 ? (
                  <div className="empty-history">No activity logged yet.</div>
               ) : (
                  transactionHistory.map((tx) => (
                     <div key={tx.id} className="tx-item">
                        <div className={`tx-icon ${tx.type}`}>
                           {tx.type === 'earn' ? <TrendingUp size={14}/> : <Gift size={14}/>}
                        </div>
                        <div className="tx-details">
                           <span className="tx-desc">{tx.description}</span>
                           <span className="tx-date">{new Date(tx.date).toLocaleDateString()}</span>
                        </div>
                        <div className={`tx-points ${tx.type}`}>
                           {tx.type === 'earn' ? '+' : '-'}{tx.points.toLocaleString()}
                        </div>
                     </div>
                  ))
               )}
            </div>
         </aside>
      </div>

      {/* Redemption Modal */}
      {selectedReward && (
         <div className="modal-overlay">
            <div className="redemption-modal">
               {redemptionSuccess ? (
                  <div className="success-state">
                     <div className="success-icon-wrap">
                        <CheckCircle2 size={64} color="var(--color-betika-green)" />
                     </div>
                     <h2>Redemption Successful!</h2>
                     <p>Your <strong>{redemptionSuccess}</strong> is ready for use in the Bet Slip.</p>
                     <div className="success-footer">Closing in a few seconds...</div>
                  </div>
               ) : (
                  <>
                     <div className="modal-header">
                        <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Confirm Redemption</h2>
                        <button className="close-btn" onClick={() => setSelectedReward(null)}><X size={24} /></button>
                     </div>
                     <div className="modal-body">
                        <div className="reward-summary-card">
                           <div className="summ-icon">
                              {selectedReward.type === 'odds_boost' ? <Zap size={32}/> : <Gift size={32}/>}
                           </div>
                           <div className="summ-text">
                              <h3>{selectedReward.name}</h3>
                              <p>{selectedReward.constraints}</p>
                           </div>
                        </div>
                        <div className="price-confirm-row">
                           <div className="pc-item">
                              <span>Points to Spend:</span>
                              <strong>{selectedReward.pointPrice.toLocaleString()} PTS</strong>
                           </div>
                           <div className="pc-item" style={{ textAlign: 'right' }}>
                              <span>Balance After:</span>
                              <strong>{(points - selectedReward.pointPrice).toLocaleString()} PTS</strong>
                           </div>
                        </div>
                     </div>
                     <div className="modal-footer">
                        <button className="btn-cancel" onClick={() => setSelectedReward(null)}>Cancel</button>
                        <button 
                          className="btn-confirm-redeem" 
                          onClick={confirmRedemption}
                          disabled={isRedeeming}
                        >
                           {isRedeeming ? <RefreshCw className="spin-anim" size={18} /> : 'Confirm Redemption'}
                        </button>
                     </div>
                  </>
               )}
            </div>
         </div>
      )}

      <style jsx>{`
        .rewards-hub-container {
          max-width: 1400px; margin: 0 auto; padding: 40px; color: #fff;
        }
        .rewards-hero {
          background: linear-gradient(135deg, rgba(105, 153, 81, 0.15) 0%, rgba(0,0,0,0) 100%);
          border: 1px solid var(--color-border); border-radius: 24px; padding: 32px; margin-bottom: 40px;
        }
        .hero-content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
        
        .player-badge { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .avatar-initials { width: 60px; height: 60px; background: var(--color-betika-green); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; box-shadow: 0 8px 16px rgba(105, 153, 81, 0.3); }
        .badge-details .welcome { font-size: 14px; opacity: 0.6; }
        .badge-details .player-name { font-size: 32px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }

        .tier-progress-card { background: rgba(255,255,255,0.03); border-radius: 20px; padding: 24px; border: 1px solid var(--color-border); }
        .tp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .cur-tier { display: flex; align-items: center; gap: 8px; font-weight: 900; text-transform: uppercase; color: var(--color-betika-yellow); font-size: 14px; }
        .pts-count { font-size: 14px; color: var(--color-text-secondary); }
        .pts-count strong { font-size: 24px; color: #fff; }

        .progress-track { height: 10px; background: rgba(0,0,0,0.4); border-radius: 5px; overflow: hidden; margin-bottom: 12px; }
        .progress-fill { height: 100%; background: var(--color-betika-green); box-shadow: 0 0 15px rgba(105, 153, 81, 0.5); transition: width 1s ease-out; }
        .tp-footer { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: var(--color-text-muted); }
        .expiry { color: #ef4444; display: flex; align-items: center; gap: 4px; }

        .hero-quick-stats { display: flex; flex-direction: column; gap: 12px; }
        .stat-card { background: rgba(255,255,255,0.03); border: 1px solid var(--color-border); border-radius: 16px; padding: 20px; text-align: center; }
        .stat-val { font-size: 24px; font-weight: 900; display: block; margin-bottom: 4px; }
        .stat-lbl { font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; font-weight: 800; }

        .section-header { margin-bottom: 30px; }
        .section-title { font-size: 24px; font-weight: 900; display: flex; align-items: center; gap: 12px; margin: 0; }
        .section-desc { font-size: 14px; color: var(--color-text-muted); margin-top: 5px; }

        .tier-ladder-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 60px; }
        .tier-node { background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: 20px; padding: 24px; text-align: center; position: relative; transition: 0.3s; }
        .tier-node.active { border-color: var(--color-betika-yellow); background: rgba(242, 214, 65, 0.05); transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .tier-node.locked { opacity: 0.5; filter: grayscale(1); }
        .tier-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-weight: 900; }
        .tier-node.active .tier-icon { background: var(--color-betika-yellow); color: #000; }
        .tier-name { font-size: 18px; font-weight: 900; margin: 0 0 4px 0; }
        .tier-range { font-size: 12px; color: var(--color-text-muted); margin-bottom: 20px; font-weight: 700; }
        .tier-perks { list-style: none; padding: 0; margin: 0; text-align: left; }
        .tier-perks li { font-size: 11px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; color: var(--color-text-secondary); font-weight: 600; }
        .current-marker { position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); background: var(--color-betika-yellow); color: #000; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; white-space: nowrap; }

        .main-rewards-grid { display: grid; grid-template-columns: 1fr 340px; gap: 40px; }
        .store-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
        .store-filters { display: flex; gap: 8px; }
        .store-filters button { background: var(--color-bg-input); border: 1px solid var(--color-border); color: #fff; padding: 10px 18px; border-radius: 12px; cursor: pointer; font-size: 12px; font-weight: 800; transition: 0.2s; }
        .store-filters button.active { background: var(--color-betika-yellow); color: #000; border-color: var(--color-betika-yellow); }

        .rewards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        .reward-card { background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: 24px; padding: 24px; position: relative; display: flex; flex-direction: column; transition: 0.3s; }
        .reward-card:hover:not(.tier-locked) { border-color: var(--color-betika-green); transform: translateY(-5px); }
        .reward-card.unaffordable { opacity: 0.7; }
        .locked-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); z-index: 10; border-radius: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; color: var(--color-betika-yellow); font-weight: 900; text-transform: uppercase; font-size: 14px; }
        
        .reward-badge-type { font-size: 10px; font-weight: 950; background: rgba(105, 153, 81, 0.15); color: var(--color-betika-green); padding: 5px 10px; border-radius: 8px; align-self: flex-start; margin-bottom: 16px; letter-spacing: 0.5px; }
        .reward-name { font-size: 20px; font-weight: 900; margin: 0 0 10px 0; }
        .reward-desc { font-size: 14px; color: var(--color-text-secondary); line-height: 1.5; flex: 1; margin-bottom: 24px; }
        
        .reward-footer { display: flex; justify-content: space-between; align-items: center; }
        .price-tag { display: flex; flex-direction: column; }
        .price-tag .price { font-size: 24px; font-weight: 950; color: #fff; line-height: 1; }
        .price-tag .lbl { font-size: 11px; color: var(--color-betika-yellow); font-weight: 800; margin-top: 4px; }

        .redeem-btn { background: var(--color-betika-green); color: #fff; border: none; padding: 12px 20px; border-radius: 12px; font-weight: 900; cursor: pointer; transition: 0.2s; }
        .redeem-btn:disabled { background: rgba(255,255,255,0.05); color: var(--color-text-muted); cursor: not-allowed; }

        .rewards-sidebar { background: rgba(255,255,255,0.02); border: 1px solid var(--color-border); border-radius: 24px; padding: 24px; height: fit-content; }
        .sidebar-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border); }
        .transaction-list { display: flex; flex-direction: column; gap: 16px; }
        .tx-item { display: flex; align-items: center; gap: 12px; }
        .tx-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .tx-icon.earn { background: rgba(105, 153, 81, 0.1); color: var(--color-betika-green); }
        .tx-icon.redeem { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .tx-details { flex: 1; }
        .tx-desc { display: block; font-size: 13px; font-weight: 700; color: #fff; }
        .tx-date { font-size: 11px; color: var(--color-text-muted); }
        .tx-points { font-weight: 900; font-size: 14px; }
        .tx-points.earn { color: var(--color-betika-green); }
        .tx-points.redeem { color: #ef4444; }
        .empty-history { text-align: center; color: var(--color-text-muted); padding: 40px 0; font-size: 14px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .redemption-modal { background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: 32px; width: 100%; max-width: 500px; padding: 40px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .close-btn { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 5px; }
        .reward-summary-card { background: rgba(255,255,255,0.03); border-radius: 20px; padding: 24px; display: flex; gap: 20px; align-items: center; margin-bottom: 30px; border: 1px solid var(--color-border); }
        .summ-icon { width: 64px; height: 64px; background: rgba(242, 214, 65, 0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: var(--color-betika-yellow); }
        .summ-text h3 { margin: 0 0 5px 0; font-size: 22px; font-weight: 900; }
        .summ-text p { margin: 0; font-size: 14px; color: var(--color-text-secondary); }
        
        .price-confirm-row { display: flex; justify-content: space-between; margin-bottom: 40px; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 16px; border: 1px solid var(--color-border); }
        .pc-item span { font-size: 12px; color: var(--color-text-muted); display: block; margin-bottom: 5px; font-weight: 800; text-transform: uppercase; }
        .pc-item strong { font-size: 20px; color: var(--color-betika-yellow); font-weight: 950; }

        .modal-footer { display: flex; gap: 15px; }
        .btn-cancel { flex: 1; background: transparent; border: 1px solid var(--color-border); color: #fff; padding: 16px; border-radius: 16px; font-weight: 800; cursor: pointer; }
        .btn-confirm-redeem { flex: 2; background: var(--color-betika-green); color: #fff; border: none; padding: 16px; border-radius: 16px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }
        
        .success-state { text-align: center; }
        .success-icon-wrap { margin-bottom: 24px; }
        .success-state h2 { font-size: 28px; font-weight: 950; margin-bottom: 10px; }
        .success-footer { font-size: 12px; color: var(--color-text-muted); margin-top: 20px; }

        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        @media (max-width: 1100px) {
           .main-rewards-grid { grid-template-columns: 1fr; }
           .tier-ladder-row { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
}

