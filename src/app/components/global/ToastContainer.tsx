'use client';

import { useToast, type Toast } from '@/context/ToastContext';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
// FIX: Import motion and AnimatePresence for smooth animations
import { motion, AnimatePresence } from 'framer-motion';

// Define the ToastType for use in this file
type ToastType = 'success' | 'error' | 'info';

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <FaCheckCircle className="text-green-500 h-6 w-6" />;
            case 'error':
                return <FaExclamationTriangle className="text-red-500 h-6 w-6" />;
            case 'info':
                return <FaInfoCircle className="text-blue-500 h-6 w-6" />;
            default:
                return null;
        }
    };

    return (
        // This container holds all the toasts and positions them on the screen.
        <div className="fixed top-5 right-5 z-[100] space-y-3 w-full max-w-md">
            <AnimatePresence>
                {toasts.map((toast: Toast) => (
                    // FIX: Use motion.div to enable animations for each toast.
                    <motion.div
                        key={toast.id}
                        layout // Ensures smooth re-ordering if toasts are dismissed out of order
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="bg-surface shadow-lg rounded-xl pointer-events-auto ring-1 ring-black ring-opacity-5"
                    >
                        <div className="p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                    {getIcon(toast.type)}
                                </div>
                                <div className="ml-3 w-0 flex-1">
                                    <p className="text-base font-semibold text-text-primary">{toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}</p>
                                    <p className="mt-1 text-sm text-text-secondary">{toast.message}</p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex">
                                    <button
                                    onClick={() => removeToast(toast.id)}
                                    className="inline-flex text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-brand"
                                    >
                                    <span className="sr-only">Close</span>
                                    <svg className="h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}