'use client';

import { Suspense } from 'react';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmationModalProvider } from '@/context/ConfirmationModalContext';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { ChatProvider } from '@/context/ChatContext';
import AuthModal from './components/AuthModal';
import FloatingChatManager from './components/FloatingChatManager';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmationModalProvider>
        {/* Suspense is needed for useSearchParams in AuthModalProvider */}
        <Suspense>
          <AuthModalProvider>
            <ChatProvider>
              {children}
              <FloatingChatManager />
              <AuthModal />
            </ChatProvider>
          </AuthModalProvider>
        </Suspense>
      </ConfirmationModalProvider>
    </ToastProvider>
  );
}