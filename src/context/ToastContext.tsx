/**
 * CODE REVIEW UPDATE
 * ------------------
 * This file has been updated based on the AI code review.
 *
 * Change Made:
 * - Suggestion #7 (Reliability): Replaced `Date.now()` with a `useRef` counter for generating unique toast IDs.
 * This prevents potential ID collisions if multiple toasts are created in the same millisecond.
 */
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={20} />,
    error: <FaExclamationCircle className="text-red-500" size={20} />,
    info: <FaInfoCircle className="text-blue-500" size={20} />,
  };

  return (
    <div className="fixed top-5 right-5 z-[100] space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="max-w-sm w-full bg-surface shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">{icons[toast.type]}</div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-text-primary">{toast.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => removeToast(toast.id)}
                  className="inline-flex text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  &times;
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdCounter = useRef(0); // Use a ref to store the counter

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = toastIdCounter.current++; // Increment the counter for a guaranteed unique ID
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};