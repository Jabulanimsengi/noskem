import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ChatProvider } from "@/context/ChatContext";
import FloatingChatManager from "./components/FloatingChatManager";
import { ToastProvider } from "@/context/ToastContext";

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
      <body className={inter.className}>
        <ToastProvider>
          <ChatProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
              <FloatingChatManager />
            </div>
          </ChatProvider>
        </ToastProvider>
      </body>
    </html>
  );
}