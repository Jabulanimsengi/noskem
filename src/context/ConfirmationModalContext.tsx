'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/Button';

interface ConfirmationOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  intent?: 'default' | 'danger';
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

  const showConfirmation = useCallback((opts: ConfirmationOptions) => {
    setOptions(opts);
  }, []);

  const handleClose = () => {
    setOptions(null);
  };

  const handleConfirm = () => {
    if (options) {
      options.onConfirm();
      handleClose();
    }
  };
  
  const isDanger = options?.intent === 'danger';

  return (
    <ConfirmationModalContext.Provider value={{ showConfirmation }}>
      {children}
      <AnimatePresence>
        {options && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()}
                    // --- FIX IS HERE: Added `overflow-hidden` to clip the child corners ---
                    className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden"
                >
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-text-primary">{options.title}</h2>
                      <p className="text-text-secondary mt-2 mb-6 whitespace-nowrap">{options.message}</p>
                    </div>
                    <div className="flex justify-end gap-3 bg-gray-50 p-4 border-t">
                      <Button variant="secondary" onClick={handleClose}>
                        {options.cancelText || 'Cancel'}
                      </Button>
                      <Button onClick={handleConfirm} className={isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand-dark'}>
                        {options.confirmText || 'Confirm'}
                      </Button>
                    </div>
                </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmationModalContext.Provider>
  );
};