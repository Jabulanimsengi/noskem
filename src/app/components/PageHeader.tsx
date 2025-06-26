'use client';

import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4 mb-6">
      <button 
        onClick={() => router.back()}
        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        aria-label="Go back"
      >
        <FaArrowLeft className="h-5 w-5 text-text-secondary" />
      </button>
      <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
    </div>
  );
}