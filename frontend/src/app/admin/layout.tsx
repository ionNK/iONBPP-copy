import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import FirstRunTour from './FirstRunTour';

/**
 * Admin shell (Internal Tool Shell, docs/prototype-style-guide.md): global
 * top bar (brand, market flag, user identity) + fixed .ds-sidenav sidebar +
 * offset content area. /admin/login overlays the shell via its fixed
 * full-viewport surface (.ds-login, z-index 10). FirstRunTour mounts the
 * one-time CoachMarks onboarding at shell level (portal, z-index 40+).
 */
export default function AdminLayout({
children,
}: {
children: React.ReactNode;
}) {
return (
<>
<TopBar />
<Sidebar />
<main className="ds-admin-main">{children}</main>
<FirstRunTour />
</>
);
}
