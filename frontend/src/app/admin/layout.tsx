'use client';
import AppShell from '@/components/layout/AppShell';

import { CountryProvider } from '@/context/CountryContext';
import { TemplatesProvider } from '@/context/TemplatesContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CountryProvider>
      <TemplatesProvider>
        <AppShell>
          {children}
        </AppShell>
      </TemplatesProvider>
    </CountryProvider>
  );
}

