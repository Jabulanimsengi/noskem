// src/app/account/dashboard/saved-searches/SavedSearchList.tsx
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { FaTrash } from 'react-icons/fa';
import { deleteSavedSearch } from './actions';
import { useToast } from '@/context/ToastContext';

type SavedSearch = {
    id: number;
    search_query: string;
    created_at: string;
};

interface SavedSearchListProps {
    initialSearches: SavedSearch[];
}

export default function SavedSearchList({ initialSearches }: SavedSearchListProps) {
    const [searches, setSearches] = useState(initialSearches);
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();

    const handleDelete = (searchId: number) => {
        startTransition(async () => {
            const result = await deleteSavedSearch(searchId);
            if (result.success) {
                // Remove the deleted item from the local state to update the UI instantly
                setSearches(currentSearches => currentSearches.filter(s => s.id !== searchId));
                showToast('Search deleted successfully!', 'success');
            } else {
                showToast(result.message, 'error');
            }
        });
    };

    if (searches.length === 0) {
        return <p className="text-center py-8 text-text-secondary">You have no saved searches.</p>;
    }

    return (
        <div className="space-y-3">
            {searches.map((search) => (
                <div key={search.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <Link href={`/search?q=${encodeURIComponent(search.search_query)}`} className="font-semibold text-brand hover:underline">
                        &quot;{search.search_query}&quot;
                    </Link>
                    <button
                        onClick={() => handleDelete(search.id)}
                        disabled={isPending}
                        className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                        title="Delete search"
                    >
                        <FaTrash />
                    </button>
                </div>
            ))}
        </div>
    );
}