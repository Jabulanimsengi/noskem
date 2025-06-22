/**
 * CODE REVIEW UPDATE
 * ------------------
 * This file has been updated based on the AI code review.
 *
 * Change Made:
 * - Suggestion #8 (Performance): Removed the blocking Leaflet CSS from the root layout.
 * This stylesheet should be loaded only on pages that render a map.
 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Script from "next/script";
import Header from "./components/Header";
import Footer from "./components/Footer"; // 1. Import the Footer component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Noskem - The Managed Marketplace",
  description: "A managed marketplace for second-hand goods you can trust.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* The Leaflet CSS has been removed from here. */}
      </head>
      <body className={`${inter.className} bg-background text-text-primary`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer /> {/* 2. Render the Footer component here */}
          </div>
        </Providers>
        <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}