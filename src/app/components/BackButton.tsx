// src/app/components/BackButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-brand"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}