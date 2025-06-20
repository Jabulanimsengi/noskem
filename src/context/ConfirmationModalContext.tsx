'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/Button';

interface ConfirmationOptions {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>; // Allow onConfirm to be async
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
    setIsConfirming(false);
    setOptions(opts);
  }, []);

  const handleClose = () => {
    setOptions(null);
  };

  const handleConfirm = async () => {
    if (options) {
      setIsConfirming(true);
      try {
        // Await the sign-out process (which includes starting the refresh)
        await options.onConfirm();
        
        // --- FIX IS HERE ---
        // After the sign-out action is complete, we manually close the modal
        // instead of waiting for the page refresh. This prevents it from getting stuck.
        handleClose();

      } catch (error) {
        console.error("Confirmation action failed", error);
        setIsConfirming(false); // On error, stop loading so the user can try again
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
                      <p className="text-text-secondary mt-2 mb-6 whitespace-nowrap">{options.message}</p>
                    </div>
                    <div className="flex justify-end gap-3 bg-gray-50 p-4 border-t">
                      <Button variant="secondary" onClick={handleClose} disabled={isConfirming}>
                        {options.cancelText || 'Cancel'}
                      </Button>
                      <Button onClick={handleConfirm} disabled={isConfirming} className="bg-brand hover:bg-brand-dark">
                        {isConfirming ? 'Signing Out...' : (options.confirmText || 'Confirm')}
                      </Button>
                    </div>
                </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmationModalContext.Provider>
  );
};