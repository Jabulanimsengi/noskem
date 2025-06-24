import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Script from "next/script";
import Header from "./components/Header";
import Footer from "./components/Footer";
// FIX: Import the new global UI components
import LoadingIndicator from "./components/global/LoadingIndicator";
import ToastContainer from "./components/global/ToastContainer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Noskem - The Managed Marketplace",
  description: "A managed marketplace for second-hand goods you can trust.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head></head>
      <body className={`${inter.className} bg-background text-text-primary`}>
        <Providers>
          {/* FIX: Render the global UI components here, inside Providers but outside the main layout div */}
          <ToastContainer />
          <LoadingIndicator />

          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </Providers>
        <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}