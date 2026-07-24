import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AIProvider } from '@/context/AIContext';
import GlobalAssistantWidget from '@/components/layout/GlobalAssistantWidget';

import { ThemeProvider } from '@/context/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Betika Promotions Platform',
  description: 'Enterprise Promotion Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
 <AIProvider>
 {children}
 <GlobalAssistantWidget />
 </AIProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
