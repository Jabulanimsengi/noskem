import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Script from "next/script";
import Header from "./components/Header"; // FIX: Import the data-fetching Header server component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Noskem - The Managed Marketplace",
  description: "A managed marketplace for second-hand goods you can trust.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" />
      </head>
      <body className={`${inter.className} bg-background text-text-primary`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header /> {/* FIX: Use the Header server component which will pass props to HeaderLayout */}
            <main className="flex-grow">{children}</main>
          </div>
        </Providers>
        <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}