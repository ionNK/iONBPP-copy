'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Inter } from 'next/font/google';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import OnboardingTour from '../onboarding/OnboardingTour';

export default function AppShell({ children, interClassName }: { children: React.ReactNode, interClassName?: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

 const isLoginPage = pathname === '/admin/login';
 const isPromotionsRoute =
pathname === '/admin/manual-award' ||
pathname === '/admin/promotions' ||
pathname?.startsWith('/admin/promotions/');

 if (isLoginPage) {
    return (
      <div className={`app-shell ${interClassName || ''}`}>
        {children}
      </div>
    );
  }

  return (
 <div className={`app-shell ${isPromotionsRoute ? 'promotions-module' : ''} ${interClassName || ''}`}>
 <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <OnboardingTour />

      {/* Mobile Toggle Button (Fixed) */}
      <button
        className="mobile-menu-btn"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu size={24} color="var(--color-text-primary)" />
      </button>

      <div className="main-content">
        <Header />
        <main className="content-area">
          {children}
        </main>
      </div>

    </div>
  );
}
