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
                        <h2 className="modal-title">Confirm Redemption</h2>
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
                           <div className="pc-item pc-item-balance">
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
    </div>
  );
}

