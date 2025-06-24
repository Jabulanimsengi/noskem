'use client';

import { useLoading } from '@/context/LoadingContext';
import { FaSpinner } from 'react-icons/fa';

export default function LoadingIndicator() {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <FaSpinner className="animate-spin text-white h-12 w-12" />
                <p className="text-white font-semibold">Loading...</p>
            </div>
        </div>
    );
}