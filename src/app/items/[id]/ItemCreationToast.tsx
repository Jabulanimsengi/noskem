// src/app/items/[id]/ItemCreationToast.tsx

'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/context/ToastContext';

export default function ItemCreationToast() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    // Check if the 'created' parameter exists in the URL
    if (searchParams.get('created') === 'true') {
      showToast('Your item has been listed successfully!', 'success');
    }
  }, [searchParams, showToast]);

  // This component renders nothing to the page itself.
  return null;
}