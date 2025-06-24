'use client';

import { useTransition } from 'react';
import { toggleFeaturedAction } from './actions';

export default function FeatureToggle({ itemId, isFeatured }: { itemId: number; isFeatured: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(() => {
      toggleFeaturedAction(itemId, isFeatured);
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-3 py-1 text-xs font-semibold text-white rounded-md ${isFeatured ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
    >
      {isPending ? '...' : (isFeatured ? 'Un-feature' : 'Feature')}
    </button>
  );
}