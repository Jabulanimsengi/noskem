'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/Button';

// Define the properties (props) the modal component will accept
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming: boolean;
}

// Use a default export for the component, making it easy to import
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isConfirming,
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
              <h2 className="text-xl font-bold text-text-primary">{title}</h2>
              <p className="text-text-secondary mt-2 mb-6 whitespace-pre-wrap">{message}</p>
            </div>
            <div className="flex justify-end gap-3 bg-gray-50 p-4 border-t">
              <Button variant="secondary" onClick={onClose} disabled={isConfirming}>
                {cancelText || 'Cancel'}
              </Button>
              <Button onClick={onConfirm} disabled={isConfirming} className="bg-red-600 hover:bg-red-700">
                {isConfirming ? 'Processing...' : (confirmText || 'Confirm')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}