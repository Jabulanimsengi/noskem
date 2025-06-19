// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ChatProvider } from "@/context/ChatContext"; // Import the provider
import FloatingChatManager from "./components/FloatingChatManager"; // Import the manager we will create next

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
        {/* Wrap everything in the ChatProvider */}
        <ChatProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            {/* The FloatingChatManager will live here */}
            <FloatingChatManager />
          </div>
        </ChatProvider>
      </body>
    </html>
  );
}