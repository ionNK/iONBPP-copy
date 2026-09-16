'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartColumn,
  ChartPie,
  ClipboardCheck,
  Crown,
  Gift,
  LayoutDashboard,
  MessageSquare,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Trophy,
  Upload,
  Users,
} from 'lucide-react';

type NavItem = {
label: string;
href?: string;
icon: ReactNode;
comingSoon?: boolean;
/** Onboarding anchor — rendered as data-tour for CoachMarks. */
tour?: string;
};

type NavGroup = {
label: string;
items: NavItem[];
};

/**
 * Internal Tool Shell nav (docs/prototype-style-guide.md): flat items under
 * UPPERCASE 12px/600 textSecondary group labels — no expandable modules, no
 * chevrons, no accent indicator bars, no brand block, no user identity block
 * (identity lives in the global top bar).
 */
const NAV_GROUPS: NavGroup[] = [
{
label: 'Insights',
items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
      { label: 'Analytics', href: '/admin/analytics', icon: <ChartColumn size={16} />, comingSoon: true },
    ],
},
{
label: 'Promotions',
items: [
{ label: 'All Promotions', href: '/admin/promotions', icon: <Gift size={16} />, tour: 'nav-promotions' },
{ label: 'Journeys', href: '/admin/promotions/journeys', icon: <Route size={16} />, comingSoon: true, tour: 'nav-journeys' },
      { label: 'Messaging', href: '/admin/promotions/messaging', icon: <MessageSquare size={16} />, comingSoon: true },
      { label: 'Gamification', href: '/admin/promotions/gamification', icon: <Trophy size={16} />, comingSoon: true },
      { label: 'Bulk Upload', href: '/admin/promotions/bulk-upload', icon: <Upload size={16} />, tour: 'nav-bulk-upload' },
{ label: 'Approvals', href: '/admin/promotions/approvals', icon: <ClipboardCheck size={16} />, tour: 'nav-approvals' },
],
},
{
label: 'CRM',
items: [
{ label: 'Players', href: '/admin/crm/players', icon: <Users size={16} />, comingSoon: true },
{ label: 'Segments', href: '/admin/crm/segments', icon: <ChartPie size={16} />, comingSoon: true },
      { label: 'VIP', href: '/admin/crm/vip', icon: <Crown size={16} />, comingSoon: true },
      { label: 'Safer Gambling', href: '/admin/crm/safer-gambling', icon: <ShieldCheck size={16} />, comingSoon: true },
],
},
{
label: 'Administration',
items: [
{ label: 'Settings', href: '/admin/settings', icon: <Settings size={16} /> },
],
},
];

/**
 * Admin side navigation — light-surface Internal Tool Shell. Ghost search
 * field at the top filters the flat nav groups. All styling lives in the
 * .ds-sidenav section of app/design-system.css.
 */
export default function Sidebar() {
const pathname = usePathname();
const [query, setQuery] = useState('');

const q = query.trim().toLowerCase();
const groups = NAV_GROUPS.map((group) => ({
...group,
items: group.items.filter((item) => !q || item.label.toLowerCase().includes(q)),
})).filter((group) => group.items.length > 0);

return (
<aside className="ds-sidenav">
<div className="ds-sidenav__search">
<Search size={16} aria-hidden="true" />
<input
value={query}
onChange={(e) => setQuery(e.target.value)}
placeholder="Search"
aria-label="Search navigation"
/>
</div>

<nav className="ds-sidenav__nav" aria-label="Admin">
{groups.map((group) => (
<div className="ds-sidenav__group" key={group.label}>
<div className="ds-sidenav__group-label">{group.label}</div>
<ul className="ds-sidenav__list">
{group.items.map((item) => {
const isActive = item.href !== undefined && pathname === item.href;

/* Unreleased items link to a teaser route; reduced emphasis + "Soon" pill kept as-is. */
if (item.comingSoon) {
return (
<li key={item.label}>
<Link
href={item.href ?? '/admin'}
className="ds-sidenav__item ds-sidenav__item--soon"
aria-current={isActive ? 'page' : undefined}
data-tour={item.tour}
>
<span className="ds-sidenav__icon">{item.icon}</span>
<span className="ds-sidenav__label">{item.label}</span>
<span className="ds-sidenav__pill">Soon</span>
</Link>
</li>
);
}

return (
<li key={item.label}>
<Link
href={item.href ?? '/admin'}
className={`ds-sidenav__item${isActive ? ' ds-sidenav__item--active' : ''}`}
aria-current={isActive ? 'page' : undefined}
data-tour={item.tour}
>
<span className="ds-sidenav__icon">{item.icon}</span>
<span className="ds-sidenav__label">{item.label}</span>
</Link>
</li>
);
})}
</ul>
</div>
))}
</nav>
</aside>
);
}
