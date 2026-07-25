'use client';
import { Bell, Search, Settings } from 'lucide-react';
import Link from 'next/link';
import CountrySwitcher from './CountrySwitcher';

export default function Header() {
  return (
    <header className="header ds-app-header">
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Search promotions by name, ID, or tag..." />
      </div>

      <div className="actions">
        {/* Market / Country scope (super admin sees all) */}
        <CountrySwitcher />

        {/* Direct Settings Link */}

        <Link href="/admin/settings" className="icon-btn" aria-label="Settings">
          <Settings size={20} />
        </Link>

        <button className="icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="badge" />
        </button>
        <div className="profile">
          <div className="avatar">A</div>
          <div className="info">
            <span className="name">Admin User</span>
            <span className="role">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
