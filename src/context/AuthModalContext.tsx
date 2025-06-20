'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type ModalView = 'signIn' | 'signUp';

interface AuthModalContextType {
  isOpen: boolean;
  view: ModalView;
  openModal: (view: ModalView) => void;
  closeModal: () => void;
  switchTo: (view: ModalView) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};

// This helper component allows us to use `useSearchParams` within the context
const AuthModalController = ({ children }: { children: ReactNode }) => {
    const searchParams = useSearchParams();
    const { openModal } = useAuthModal();
  
    useEffect(() => {
      if (searchParams.get('authModal')) {
        openModal('signIn');
      }
    }, [searchParams, openModal]);
  
    return <>{children}</>;
}


export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ModalView>('signIn');

  const openModal = (view: ModalView) => {
    setView(view);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const switchTo = (newView: ModalView) => {
    setView(newView);
  };

  return (
    <AuthModalContext.Provider value={{ isOpen, view, openModal, closeModal, switchTo }}>
        <AuthModalController>
            {children}
        </AuthModalController>
    </AuthModalContext.Provider>
  );
};