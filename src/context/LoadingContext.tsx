'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
// FIX: Import a spinner icon for the new loader
import { FaSpinner } from 'react-icons/fa';

interface LoadingContextType {
  showLoader: () => void;
  hideLoader: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      
      {/* FIX: This is the new, more obvious loading overlay UI */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <FaSpinner className="animate-spin text-white h-12 w-12" />
            <p className="text-white font-semibold">Loading...</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};