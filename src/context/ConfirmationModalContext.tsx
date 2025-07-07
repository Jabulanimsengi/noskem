// src/context/ConfirmationModalContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import ConfirmationModal from '@/app/components/ConfirmationModal';

export interface ConfirmationOptions {
  title: string;
  message: string;
  // FIX: The onConfirm function now accepts an optional string
  onConfirm: (inputValue?: string) => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  // Add a property to tell the modal if an input is needed
  requiresInput?: boolean;
}

interface ConfirmationModalContextType {
  showConfirmation: (options: ConfirmationOptions) => void;
  hideConfirmation: () => void;
  options: ConfirmationOptions | null;
}

const ConfirmationModalContext = createContext<ConfirmationModalContextType | undefined>(undefined);

export const ConfirmationModalProvider = ({ children }: { children: ReactNode }) => {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  // Add state to manage the value of the input field
  const [inputValue, setInputValue] = useState('');

  const showConfirmation = (newOptions: ConfirmationOptions) => {
    setOptions(newOptions);
    setInputValue(''); // Reset input on each new modal
  };

  const hideConfirmation = () => {
    setOptions(null);
    setIsConfirming(false);
  };

  const handleConfirm = async () => {
    if (options?.onConfirm) {
      setIsConfirming(true);
      try {
        // Pass the inputValue from the state to the onConfirm function
        await options.onConfirm(inputValue);
      } finally {
        setIsConfirming(false);
        hideConfirmation(); // Hide modal after action is complete
      }
    }
  };

  const handleCancel = () => {
    if (options?.onCancel) {
      options.onCancel();
    }
    hideConfirmation();
  };

  return (
    <ConfirmationModalContext.Provider value={{ showConfirmation, hideConfirmation, options }}>
      {children}
      {options && (
        <ConfirmationModal
          isOpen={!!options}
          onClose={handleCancel}
          onConfirm={handleConfirm}
          title={options.title}
          message={options.message}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          isConfirming={isConfirming}
          // Pass the new props to the modal component
          requiresInput={options.requiresInput}
          inputValue={inputValue}
          setInputValue={setInputValue}
        />
      )}
    </ConfirmationModalContext.Provider>
  );
};

export const useConfirmationModal = () => {
  const context = useContext(ConfirmationModalContext);
  if (context === undefined) {
    throw new Error('useConfirmationModal must be used within a ConfirmationModalProvider');
  }
  return context;
};