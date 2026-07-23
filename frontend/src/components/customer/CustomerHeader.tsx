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
<Link href="/customer/sports/live" className={`nav-link nav-link-live ${isItemActive('/customer/sports/live') ? 'active' : ''}`}>
<span className="live-dot"></span> Live In-Play
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
</header>
);
}
