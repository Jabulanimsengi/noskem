'use client';

import { ToastProvider } from '@/context/ToastContext';
import { ConfirmationModalProvider } from '@/context/ConfirmationModalContext';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { ChatProvider } from '@/context/ChatContext';
import { LoadingProvider } from '@/context/LoadingContext';
import AuthModal from './components/AuthModal';
import FloatingChatManager from './components/FloatingChatManager';
// FIX: The standalone ConfirmationModal component is no longer needed.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <ToastProvider>
        <ConfirmationModalProvider>
          <AuthModalProvider>
            <ChatProvider>
              {children}
              <FloatingChatManager />
              <AuthModal />
              {/* FIX: The ConfirmationModal component is removed from here. */}
            </ChatProvider>
          </AuthModalProvider>
        </ConfirmationModalProvider>
      </ToastProvider>
    </LoadingProvider>
  );
}