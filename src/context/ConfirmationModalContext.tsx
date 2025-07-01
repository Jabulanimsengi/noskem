'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import ConfirmationModal from '@/app/components/ConfirmationModal';

// FIX: Add the optional confirmText and cancelText properties to this interface.
// This will resolve the error in OrdersClient.tsx and other components.
interface ConfirmationOptions {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmationContextType {
  showConfirmation: (options: ConfirmationOptions) => void;
}

const ConfirmationModalContext = createContext<ConfirmationContextType | undefined>(undefined);

export const useConfirmationModal = () => {
  const context = useContext(ConfirmationModalContext);
  if (!context) {
    throw new Error('useConfirmationModal must be used within a ConfirmationModalProvider');
  }
  return context;
};

export const ConfirmationModalProvider = ({ children }: { children: ReactNode }) => {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const showConfirmation = useCallback((opts: ConfirmationOptions) => {
    setOptions(opts);
    setIsConfirming(false);
  }, []);

  const handleClose = () => {
    if (isConfirming) return;
    setOptions(null);
  };

  const handleConfirm = async () => {
    if (options) {
      setIsConfirming(true);
      try {
        await options.onConfirm();
      } catch (error) {
        console.error("Confirmation action failed", error);
      } finally {
        setIsConfirming(false);
        setOptions(null);
      }
    }
  };

  return (
    <ConfirmationModalContext.Provider value={{ showConfirmation }}>
      {children}
      {options && (
        <ConfirmationModal
          isOpen={!!options}
          onClose={handleClose}
          onConfirm={handleConfirm}
          isConfirming={isConfirming}
          title={options.title}
          message={options.message}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
        />
      )}
    </ConfirmationModalContext.Provider>
  );
};