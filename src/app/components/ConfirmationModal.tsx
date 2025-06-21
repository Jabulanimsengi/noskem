'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/Button';

// The options that can be passed to the confirmation modal
interface ConfirmationOptions {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
}

// The context only needs to expose the function that triggers the modal
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

// The Provider component now contains all the state and renders the modal UI itself.
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
              className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-text-primary">{options.title}</h2>
                <p className="text-text-secondary mt-2 mb-6 whitespace-pre-wrap">{options.message}</p>
              </div>
              <div className="flex justify-end gap-3 bg-gray-50 p-4 border-t">
                <Button variant="secondary" onClick={handleClose} disabled={isConfirming}>
                  {options.cancelText || 'Cancel'}
                </Button>
                <Button onClick={handleConfirm} disabled={isConfirming} className="bg-red-600 hover:bg-red-700">
                  {isConfirming ? 'Processing...' : (options.confirmText || 'Confirm')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmationModalContext.Provider>
  );
};