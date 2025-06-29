import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import HeaderLayout from './components/HeaderLayout'; // Corrected: Import HeaderLayout
import Footer from './components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Noskem - The Managed Marketplace',
  description: 'A managed marketplace for second-hand goods you can trust.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://js.paystack.co/v1/inline.js" async />
      </head>
      <body className={`${inter.className} bg-background text-text-primary`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <HeaderLayout /> {/* Corrected: Render HeaderLayout, not Header */}
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}