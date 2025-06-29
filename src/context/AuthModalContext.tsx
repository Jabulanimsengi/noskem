'use client';

import React, { createContext, useContext, useState, useCallback, Suspense, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type AuthView = 'sign_in' | 'sign_up';

type AuthModalContextType = {
  isOpen: boolean;
  view: AuthView;
  openModal: (view: AuthView) => void;
  closeModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

function AuthModalURLHandler() {
    const { openModal } = useAuthModal();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('authModal') === 'true') {
            openModal('sign_in');
        }
    }, [searchParams, openModal]);

    return null;
}

export const AuthModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AuthView>('sign_in');
  const router = useRouter();
  const pathname = usePathname();

  // Corrected: Now properly accepts and sets the view
  const openModal = useCallback((viewToShow: AuthView) => {
    setView(viewToShow);
    const params = new URLSearchParams(window.location.search);
    params.set('authModal', 'true');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(true);
  }, [router, pathname]);

  const closeModal = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete('authModal');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  }, [router, pathname]);

  const value = { isOpen, view, openModal, closeModal };

  return (
    <AuthModalContext.Provider value={value}>
      <Suspense fallback={null}>
          <AuthModalURLHandler />
      </Suspense>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};