import { User, CreditCard, History, Settings, LogOut, CheckCircle2, Award } from 'lucide-react';
import Link from 'next/link';

export default function AccountDashboard() {
  return (
    <div className="customer-container">
      <h1 className="hero-title" style={{ fontSize: '32px', marginBottom: '32px' }}>My Account</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '40px' }}>
        
        {/* Account Sidebar Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <User size={24} color="var(--color-text-primary)" />
                </div>
                <div>
                   <h3 style={{ margin: 0, fontSize: '16px' }}>John Doe</h3>
                   <span style={{ color: 'var(--color-betika-green)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12}/> Verified</span>
                </div>
             </div>
          </div>
          
          <Link href="/customer/account" className="chip active" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', justifyContent: 'flex-start' }}>
             <CreditCard size={18} /> Wallet & Balance
          </Link>
          <Link href="/customer/rewards" className="chip" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', justifyContent: 'flex-start', color: 'var(--color-betika-yellow)' }}>
             <Award size={18} /> Rewards Hub
          </Link>
          <Link href="#" className="chip" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', justifyContent: 'flex-start' }}>
             <History size={18} /> Transaction History
          </Link>
          <Link href="#" className="chip" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', justifyContent: 'flex-start' }}>
             <Settings size={18} /> Profile Settings
          </Link>
          <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
             <Link href="/admin/login" className="chip" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', justifyContent: 'flex-start', color: '#ef4444' }}>
                <LogOut size={18} /> Log Out
             </Link>
          </div>
        </div>

        {/* Account Main Content (Wallet) */}
        <div>
           <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
             <h2 style={{ margin: '0 0 24px 0', fontSize: '18px' }}>Wallet Balance</h2>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div style={{ background: 'var(--color-bg-input)', padding: '24px', borderRadius: '16px' }}>
                   <p className="game-provider">Cash Balance</p>
                   <p style={{ fontSize: '32px', fontWeight: 700, margin: '8px 0 0 0' }}>$1,250<span style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>.00</span></p>
                </div>
                <div style={{ background: 'var(--color-bg-input)', padding: '24px', borderRadius: '16px', position: 'relative' }}>
                   <span style={{ position: 'absolute', top: 12, right: 12, background: 'var(--color-betika-yellow)', color: '#000', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '12px' }}>ACTIVE</span>
                   <p className="game-provider">Free Bets</p>
                   <p style={{ fontSize: '32px', fontWeight: 700, margin: '8px 0 0 0', color: 'var(--color-betika-yellow)' }}>$10<span style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>.00</span></p>
                </div>
                <div style={{ background: 'var(--color-bg-input)', padding: '24px', borderRadius: '16px' }}>
                   <p className="game-provider">Withdrawable</p>
                   <p style={{ fontSize: '32px', fontWeight: 700, margin: '8px 0 0 0', color: 'var(--color-betika-green)' }}>$1,250<span style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>.00</span></p>
                </div>
             </div>

             <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                <button className="btn-cta" style={{ background: 'var(--color-betika-green)', color: '#fff', flex: 1 }}>Deposit</button>
                <button className="btn-outline" style={{ flex: 1 }}>Withdraw</button>
             </div>
           </div>

           <div className="glass-panel" style={{ padding: '32px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
               <h2 style={{ margin: 0, fontSize: '18px' }}>Recent Activity & Rewards</h2>
               <Link href="#" className="view-all">View All</Link>
             </div>
             
             <table className="promo-table">
               <thead>
                 <tr>
                   <th>Date</th>
                   <th>Type</th>
                   <th>Details / Amount</th>
                   <th>Status</th>
                 </tr>
               </thead>
               <tbody>
                  <tr>
                     <td>Apr 18, 2026</td>
                     <td><span className="badge-type" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--color-accent-purple)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>Reward Redeemed</span></td>
                     <td style={{ color: 'var(--color-text-primary)' }}>$10 Free Bet (-1,000 pts)</td>
                     <td><span className="status-dot active"></span> Applied</td>
                  </tr>
                  <tr>
                     <td>Apr 18, 2026</td>
                     <td><span className="badge-type">Deposit</span></td>
                     <td style={{ color: 'var(--color-betika-green)', fontWeight: 600 }}>+$500.00</td>
                     <td><span className="status-dot active"></span> Completed</td>
                  </tr>
                  <tr>
                     <td>Apr 16, 2026</td>
                     <td><span className="badge-type" style={{ background: 'rgba(242, 214, 65, 0.1)', color: 'var(--color-betika-yellow)', borderColor: 'rgba(242, 214, 65, 0.2)' }}>Bonus Credited</span></td>
                     <td style={{ color: 'var(--color-betika-yellow)', fontWeight: 600 }}>+$200.00</td>
                     <td><span className="status-dot active"></span> Completed</td>
                  </tr>
               </tbody>
             </table>
           </div>
        </div>

      </div>
    </div>
  );
}
