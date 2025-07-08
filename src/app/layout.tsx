// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';

// Import your central Providers component
import { Providers } from '@/app/providers';

// Import the Header, Footer, and new BottomNavBar components
import HeaderLayout from '@/app/components/HeaderLayout';
import Footer from '@/app/components/Footer';
import BottomNavBar from './components/BottomNavBar';

// --- 1. Import the Vercel Analytics component ---
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Your Marketplace',
  description: 'The best place to buy and sell second-hand goods.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col h-full bg-background`}>
        <Providers>
          <HeaderLayout />

          <main className="flex-grow pb-20 md:pb-0">
            {children}
          </main>
          
          <Footer />

          <BottomNavBar />

          <div id="modal-root"></div>
        </Providers>

        <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
        
        {/* --- 2. Add the Analytics component here --- */}
        <Analytics />
      </body>
    </html>
  );
}