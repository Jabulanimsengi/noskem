'use client';

import { useState, useEffect } from 'react';

// This custom hook delays updating a value until a certain amount of time has passed.
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to cancel the timeout if the value changes again
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}