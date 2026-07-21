'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, ShieldCheck, BarChart3, LogOut, ChevronRight, ChevronDown, Layers, Users, TrendingUp, Gift, LayoutGrid, FlaskConical, X, Contact, Brain, HeartPulse, PieChart, Search, ScrollText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

type NavItem = { name: string; path: string; icon: LucideIcon; id: string };
type NavSection = { title: string; items: NavItem[] };

const dashboardItem: NavItem = { name: 'Dashboard', path: '/admin', icon: LayoutGrid, id: 'nav-dashboard' };

// Logical, task-oriented grouping so users can find things by "what am I trying to do".
const navSections: NavSection[] = [
  {
    title: 'PROMOTIONS',
    items: [
      { name: 'All Promotions', path: '/admin/promotions', icon: Megaphone, id: 'nav-promotions' },
      { name: 'Manual Award', path: '/admin/manual-award', icon: Gift, id: 'nav-manual-award' },
      { name: 'Experiments', path: '/admin/experiments', icon: FlaskConical, id: 'nav-experiments' },
    ],
  },
  {
    title: 'CUSTOMERS',
    items: [
      { name: 'Overview', path: '/admin/crm', icon: Contact, id: 'nav-crm' },
      { name: 'Player 360', path: '/admin/crm/players', icon: Users, id: 'nav-crm-players' },
      { name: 'Segments', path: '/admin/crm/segments', icon: Layers, id: 'nav-crm-segments' },
      { name: 'Intelligence', path: '/admin/crm/intelligence', icon: Brain, id: 'nav-crm-intelligence' },
      { name: 'Responsible Gaming', path: '/admin/crm/responsible-gaming', icon: HeartPulse, id: 'nav-crm-rg' },
    ],
  },
  {
    title: 'INSIGHTS',
    items: [
      { name: 'CRM Analytics', path: '/admin/crm/analytics', icon: PieChart, id: 'nav-crm-analytics' },
      { name: 'Reports', path: '/admin/reports', icon: BarChart3, id: 'nav-reports' },
      { name: 'Churn Prediction', path: '/admin/predictions/churn', icon: TrendingUp, id: 'nav-pred-churn' },
      { name: 'Promo Prediction', path: '/admin/predictions/promotions', icon: Brain, id: 'nav-pred-promotions' },
    ],
  },
  {
    title: 'GOVERNANCE & SUPPORT',
    items: [
      { name: 'Compliance', path: '/admin/governance', icon: ShieldCheck, id: 'nav-governance' },
      { name: 'Audit Trail', path: '/admin/promotions/audit', icon: ScrollText, id: 'nav-audit' },
      { name: 'Customer Lookup', path: '/admin/promotions/customer-lookup', icon: Search, id: 'nav-customer-lookup' },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname?.startsWith(href)) return true;
    return false;
  };

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (title: string) =>
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));

  // Route-aware active detection. Player 360 owns individual player detail pages
  // (/admin/crm/[id]) that don't match any other CRM item.
  const crmPaths = navSections.find((s) => s.title === 'CUSTOMERS')?.items.map((i) => i.path) ?? [];
  const sectionItemActive = (path: string) => {
    if (path === '/admin/crm') return pathname === '/admin/crm';
    if (path === '/admin/crm/players') {
      const p = pathname ?? '';
      const isPlayerDetail =
        p.startsWith('/admin/crm/') &&
        !crmPaths.some((cp) => cp !== '/admin/crm' && p.startsWith(cp));
      return p.startsWith('/admin/crm/players') || isPlayerDetail;
    }
    return isItemActive(path);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/admin/login';
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="logo-area">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px',
              width: '100%',
              flexWrap: 'nowrap',
            }}
          >
            <img
              src="/assets/logo.png"
              alt="Betika"
              style={{ height: '36px', width: 'auto', objectFit: 'contain', display: 'block', flexShrink: 0 }}
            />
            <span className="logo-text" style={{ color: 'var(--color-text-primary)' }}>
              Betika<span className="text-yellow">.</span>
            </span>
          </div>
          {/* Mobile Close Button */}
          <button className="mobile-close-btn" onClick={onClose} style={{ color: 'var(--color-text-primary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="nav-container">
          <p className="nav-title" style={{ marginTop: 0 }}>MAIN MENU</p>
          <div className="nav-list">
            {[dashboardItem].map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  id={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon size={20} />
                  <span style={{ flex: 1 }}>{item.name}</span>
                  {isActive && <ChevronRight size={16} />}
                </Link>
              );
            })}
          </div>

          {navSections.map((section) => {
            const collapsed = collapsedSections[section.title] ?? false;
            const hasActiveChild = section.items.some((it) => sectionItemActive(it.path));
            return (
              <div key={section.title} className="nav-group">
                <button
                  type="button"
                  className="nav-title nav-title-toggle mt-6"
                  aria-expanded={!collapsed}
                  onClick={() => toggleSection(section.title)}
                >
                  <span style={{ flex: 1, textAlign: 'left' }}>{section.title}</span>
                  {hasActiveChild && collapsed && <span className="nav-group-dot" aria-hidden />}
                  {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
                {!collapsed && (
                  <div className="nav-list">
                    {section.items.map((item) => {
                      const isActive = sectionItemActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          id={item.id}
                          className={`nav-item ${isActive ? 'active' : ''}`}
                          onClick={onClose}
                        >
                          <item.icon size={20} />
                          <span style={{ flex: 1 }}>{item.name}</span>
                          {isActive && <ChevronRight size={16} />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Profile */}
        <div className="footer-profile">
          <div className="profile-bg">
            <div className="avatar">A</div>
            <div className="meta">
              <p className="name">Admin User</p>
              <p className="role">Super Admin</p>
            </div>
            <button className="logout" onClick={handleLogout}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
    </>
  );
}
