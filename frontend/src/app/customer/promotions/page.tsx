import { Gift, Calendar, Award } from 'lucide-react';

export default function PromotionsPage() {
  return (
    <div className="customer-container">
      <div className="section-header" style={{ marginBottom: '40px' }}>
        <div>
          <h1 className="hero-title" style={{ fontSize: '36px', marginBottom: '8px' }}>Your Promotions</h1>
          <p className="hero-desc">Claim your exclusive rewards and climb the VIP ladder.</p>
        </div>
      </div>

      <div className="promo-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', gap: '32px' }}>
        
        <div className="promo-card" style={{ borderLeft: '4px solid var(--color-betika-yellow)' }}>
          <div className="promo-info">
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Gift size={20} color="var(--color-betika-yellow)" />
                <span style={{ color: 'var(--color-betika-yellow)', fontWeight: 700, fontSize: '13px' }}>NEW PLAYER OFFER</span>
             </div>
             <h3 className="promo-name" style={{ fontSize: '28px' }}>200% First Deposit Match</h3>
             <p className="promo-desc" style={{ fontSize: '16px', maxWidth: '600px' }}>Double your first deposit instantly. Make a deposit of up to $500 and we will match it with a 200% bonus balance to use in the Casino.</p>
             <button className="btn-cta">Deposit & Claim</button>
          </div>
          <div style={{ width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(242,214,65,0.2) 0%, transparent 70%)', position: 'absolute', right: '-20px', top: '-20px', borderRadius: '50%' }}></div>
        </div>

        <div className="promo-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
           <div className="promo-card" style={{ borderLeft: '4px solid var(--color-betika-green)' }}>
              <div className="promo-info">
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Calendar size={18} color="var(--color-betika-green)" />
                    <span style={{ color: 'var(--color-betika-green)', fontWeight: 700, fontSize: '12px' }}>WEEKLY</span>
                 </div>
                 <h3 className="promo-name">Weekend Cashback</h3>
                 <p className="promo-desc">Get 10% back on your slots losses every Saturday and Sunday.</p>
                 <button className="btn-outline">Opt In</button>
              </div>
           </div>
           
           <div className="promo-card" style={{ borderLeft: '4px solid var(--color-accent-purple)' }}>
              <div className="promo-info">
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Award size={18} color="var(--color-accent-purple)" />
                    <span style={{ color: 'var(--color-accent-purple)', fontWeight: 700, fontSize: '12px' }}>VIP TIER</span>
                 </div>
                 <h3 className="promo-name">Level Up Rewards</h3>
                 <p className="promo-desc">You are 450 points away from Platinum Tier. Unlock exclusive daily spins.</p>
                 <button className="btn-outline">View Status</button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
