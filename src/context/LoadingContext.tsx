'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
import HeaderSkeleton from '../app/components/skeletons/HeaderSkeleton';

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
      {isLoading && (
        <div className="fixed inset-0 bg-white z-[100]">
          <HeaderSkeleton />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};