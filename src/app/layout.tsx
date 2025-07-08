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
import BottomNavBar from './components/BottomNavBar'; // Import the new component

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

          {/* MOBILE OPTIMIZATION: Added bottom padding to prevent content from being hidden by the nav bar. */}
          <main className="flex-grow pb-20 md:pb-0">
            {children}
          </main>
          
          <Footer />

          {/* The new bottom navigation bar is added here for mobile */}
          <BottomNavBar />

          {/* This is the target for your confirmation modal portal */}
          <div id="modal-root"></div>
        </Providers>

        {/* This loads the Paystack script, making the payment pop-up available. */}
        <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
