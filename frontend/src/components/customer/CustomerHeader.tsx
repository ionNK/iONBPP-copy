'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, User, Bell, Search, PlusCircle, Trophy, Sun, Moon } from 'lucide-react';
import { useRewards } from '@/context/RewardsContext';
import { useTheme } from '@/context/ThemeContext';

export default function CustomerHeader() {
  const pathname = usePathname();
  const { points, currentTier } = useRewards();
  const { theme, toggleTheme } = useTheme();

  const isItemActive = (href: string) => {
    if (href === '/customer' && pathname === '/customer') return true;
    if (href !== '/customer' && pathname?.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="customer-header">
      <div className="header-left">
        <Link href="/customer" className="logo-link">
          <img src="/assets/logo.png" alt="Betika" className="h-logo" />
          <span className="logo-text">Betika<span className="text-yellow">.</span></span>
        </Link>
        <nav className="header-nav">
          <Link href="/customer" className={`nav-link ${isItemActive('/customer') ? 'active' : ''}`}>
            Lobby
          </Link>
          <Link href="/customer/sports" className={`nav-link ${isItemActive('/customer/sports') ? 'active' : ''}`}>
            Sports
          </Link>
          <Link href="/customer/sports/live" className={`nav-link ${isItemActive('/customer/sports/live') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-dot" style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 6px #ef4444' }}></span> Live In-Play
          </Link>
          <Link href="/customer/games" className={`nav-link ${isItemActive('/customer/games') ? 'active' : ''}`}>
            Games
          </Link>
          <Link href="/customer/promotions" className={`nav-link ${isItemActive('/customer/promotions') ? 'active' : ''}`}>
            Promotions
          </Link>
          <Link href="/customer/rewards" className={`nav-link ${isItemActive('/customer/rewards') ? 'active' : ''}`}>
            Rewards
          </Link>
        </nav>
      </div>

      <div className="header-right">
        <div className="search-bar-sm">
          <Search size={16} />
          <input type="text" placeholder="Find games..." />
        </div>

        <Link href="/customer/rewards" className="header-rewards-pill">
           <div className="tier-icon">{currentTier[0]}</div>
           <div className="points-info">
              <span className="pts">{points.toLocaleString()}</span>
              <span className="label">PTS</span>
           </div>
        </Link>

        <div className="wallet-area">
          <div className="balance-display">
            <span className="currency">KES</span>
            <span className="amount">1,250.00</span>
          </div>
          <button className="btn-deposit">
            <PlusCircle size={16} /> Deposit
          </button>
        </div>

        <button className="icon-btn-rounded" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="icon-btn-rounded">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>

        <Link href="/customer/account" className="profile-btn">
          <User size={20} />
        </Link>
      </div>

      <style jsx>{`
        .customer-header {
          height: 80px;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 48px;
        }
        .logo-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }
        .h-logo {
          height: 32px;
        }
        .logo-text {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
        }
        .text-yellow { color: var(--color-betika-yellow); }
        
        .header-nav {
          display: flex;
          gap: 32px;
        }
        .nav-link {
          color: var(--color-text-secondary);
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: color 0.2s;
          position: relative;
        }
        .nav-link:hover { color: #fff; }
        .nav-link.active { color: var(--color-betika-yellow); }
        .nav-link.active::after {
          content: ''; position: absolute; bottom: -28px; left: 0; width: 100%; height: 3px;
          background: var(--color-betika-yellow); border-radius: 4px 4px 0 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .search-bar-sm {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--color-bg-input);
          border: 1px solid var(--color-border);
          padding: 8px 16px;
          border-radius: 20px;
          color: var(--color-text-muted);
        }
        .search-bar-sm input {
          background: transparent; border: none; outline: none; color: #fff; font-size: 14px; width: 120px;
        }

        .header-rewards-pill {
            display: flex;
            align-items: center;
            background: rgba(242, 214, 65, 0.1);
            border: 1px solid rgba(242, 214, 65, 0.2);
            border-radius: 20px;
            padding: 4px 12px 4px 4px;
            gap: 10px;
            text-decoration: none;
            transition: 0.2s;
        }
        .header-rewards-pill:hover { background: rgba(242, 214, 65, 0.2); transform: translateY(-1px); }
        .tier-icon { 
            width: 28px; height: 28px; background: var(--color-betika-yellow); 
            border-radius: 50%; color: #000; display: flex; align-items: center; 
            justify-content: center; font-weight: 900; font-size: 14px; 
        }
        .points-info { display: flex; flex-direction: column; line-height: 1; }
        .points-info .pts { color: #fff; font-weight: 800; font-size: 13px; }
        .points-info .label { color: var(--color-betika-yellow); font-size: 9px; font-weight: 900; }
        
        .wallet-area {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 4px 4px 4px 16px;
          gap: 16px;
        }
        .balance-display {
          display: flex; align-items: baseline; gap: 4px; color: #fff; font-weight: 700;
        }
        .currency { color: var(--color-text-muted); font-size: 11px; font-weight: 900; }
        .amount { font-size: 15px; }
        
        .btn-deposit {
          background: var(--color-betika-green);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn-deposit:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(105, 153, 81, 0.3); }

        .icon-btn-rounded {
          background: transparent;
          border: 1px solid var(--color-border);
          width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--color-text-primary); cursor: pointer; position: relative;
        }
        .icon-btn-rounded:hover { background: var(--color-bg-input); }
        .notification-dot {
          position: absolute; top: 10px; right: 12px; width: 8px; height: 8px;
          background: #ef4444; border-radius: 50%; box-shadow: 0 0 6px #ef4444;
        }
        .profile-btn {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--color-bg-input); display: flex; align-items: center; justify-content: center;
          color: var(--color-text-primary); text-decoration: none; border: 1px solid var(--color-border);
        }
        .profile-btn:hover { background: var(--color-bg-input-focus); border-color: var(--color-border-hover); }
      `}</style>
    </header>
  );
}
