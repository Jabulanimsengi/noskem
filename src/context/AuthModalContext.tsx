'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

// FIX: Use the correct view types required by Supabase Auth UI
export type AuthView = 'sign_in' | 'sign_up';

interface AuthModalContextType {
  isOpen: boolean;
  view: AuthView;
  openModal: (view?: AuthView) => void;
  closeModal: () => void;
  switchTo: (newView: AuthView) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  // FIX: Update the default state to use the correct type
  const [view, setView] = useState<AuthView>('sign_in');

  const openModal = (initialView: AuthView = 'sign_in') => {
    setView(initialView);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const switchTo = (newView: AuthView) => {
    setView(newView);
  };

  return (
    <AuthModalContext.Provider value={{ isOpen, view, openModal, closeModal, switchTo }}>
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