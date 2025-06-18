import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Script from "next/script"; // Import the Next.js Script component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Second-Hand Marketplace",
  description: "Buy and sell second-hand items with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* ADD THE PAYSTACK SCRIPT HERE */}
        <Script src="https://js.paystack.co/v1/inline.js" strategy="beforeInteractive" />
      </head>
      <body
        className={`${inter.className} bg-gray-900 text-white antialiased`}
      >
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}