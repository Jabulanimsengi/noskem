'use client';

import { ToastProvider } from '@/context/ToastContext';
import { ConfirmationModalProvider } from '@/context/ConfirmationModalContext';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { ChatProvider } from '@/context/ChatContext';
import { LoadingProvider } from '@/context/LoadingContext';
import AuthModal from './components/AuthModal';
import FloatingChatManager from './components/FloatingChatManager'; // Import the chat manager
import ToastContainer from './components/global/ToastContainer';
import LoadingIndicator from './components/global/LoadingIndicator';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <ToastProvider>
        <ConfirmationModalProvider>
          <AuthModalProvider>
            <ChatProvider>
              {children}
              <AuthModal />
              <ToastContainer />
              <LoadingIndicator />
              <FloatingChatManager /> {/* FIX: Add the FloatingChatManager here */}
            </ChatProvider>
          </AuthModalProvider>
        </ConfirmationModalProvider>
      </ToastProvider>
    </LoadingProvider>
  );
}