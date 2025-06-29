'use client';

import { useTransition } from 'react';
import { useToast } from '@/context/ToastContext';
import { saveSearchAction } from './actions';
import { FaBookmark } from 'react-icons/fa';

export default function SaveSearchButton({ query }: { query: string }) {
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();

    if (!query) {
        return null;
    }

    const handleSave = () => {
        startTransition(async () => {
            const result = await saveSearchAction(query);
            if (result.success) {
                showToast(result.message || 'Search Saved!', 'success');
            } else if (result.error) {
                showToast(result.error, 'error');
            }
        });
    };

    return (
        <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark disabled:bg-gray-400"
        >
            <FaBookmark />
            {isPending ? 'Saving...' : 'Save Search'}
        </button>
    );
}
