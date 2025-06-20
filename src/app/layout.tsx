import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ChatProvider } from "@/context/ChatContext";
import FloatingChatManager from "./components/FloatingChatManager";
import { ToastProvider } from "@/context/ToastContext";
import Script from "next/script";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { ConfirmationModalProvider } from "@/context/ConfirmationModalContext";
import AuthModal from "./components/AuthModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MarketHub - Buy & Sell Everything",
  description: "The managed marketplace you can trust.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Leaflet CSS for maps */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin=""/>
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <ConfirmationModalProvider>
            <AuthModalProvider>
              <ChatProvider>
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    {children}
                  </main>
                  <Footer />
                  <FloatingChatManager />
                </div>
                {/* Global modal components */}
                <AuthModal />
              </ChatProvider>
            </AuthModalProvider>
          </ConfirmationModalProvider>
        </ToastProvider>
        
        {/* Paystack Script for payments */}
        <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}