import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmationModalProvider } from '@/context/ConfirmationModalContext';
import { ChatProvider } from '@/context/ChatContext';
import HeaderLayout from './components/HeaderLayout';
import AuthModal from './components/AuthModal';
import ToastContainer from './components/global/ToastContainer'; // Import the new container

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Noskem - The Managed Marketplace',
  description: 'A secure and trusted way to buy and sell second-hand goods, verified by our expert agents.',
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
          <ConfirmationModalProvider>
            <ChatProvider>
              <AuthModalProvider>
                <HeaderLayout />
                <main className="min-h-screen bg-gray-50">
                  {children}
                </main>
                <AuthModal />
                <ToastContainer /> {/* Render the container here */}
              </AuthModalProvider>
            </ChatProvider>
          </ConfirmationModalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}