'use client';

import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-brand transition-colors"
    >
      <FaArrowLeft />
      <span>Back</span>
    </button>
  );
}