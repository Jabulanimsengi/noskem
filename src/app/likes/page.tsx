'use client';

import { useState, useEffect, useCallback } from 'react';
import { type ItemWithProfile } from '@/types';
import { getGuestLikes, clearGuestLikes } from '@/utils/guestLikes';
import ItemCard from '@/app/components/ItemCard';
import PageHeader from '@/app/components/PageHeader';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';
import GridSkeletonLoader from '@/app/components/skeletons/GridSkeletonLoader';

export default function GuestLikedItemsPage() {
    const [items, setItems] = useState<ItemWithProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showConfirmation } = useConfirmationModal();

    const fetchLikedItems = useCallback(async () => {
        setIsLoading(true);
        const likedItemIds = getGuestLikes();

        if (likedItemIds.length > 0) {
            try {
                const response = await fetch('/api/items-by-id', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemIds: likedItemIds }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch item details');
                }

                const data = await response.json();
                setItems(data.items || []);
            } catch (error) {
                console.error(error);
                setItems([]);
            }
        } else {
            setItems([]);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchLikedItems();
    }, [fetchLikedItems]);

    // Listen for storage changes to re-fetch data if likes are cleared from another tab/component
    useEffect(() => {
        window.addEventListener('storage', fetchLikedItems);
        return () => {
            window.removeEventListener('storage', fetchLikedItems);
        };
    }, [fetchLikedItems]);


    const handleClearAll = () => {
        showConfirmation({
            title: "Clear All Liked Items",
            message: "Are you sure you want to remove all items from your liked list?",
            confirmText: "Yes, Clear All",
            onConfirm: () => {
                clearGuestLikes();
                setItems([]); // Immediately clear the UI
            }
        });
    };

    return (
        <div className="container mx-auto max-w-4xl py-8 px-4">
            <div className="flex justify-between items-center">
                <PageHeader title="My Liked Items" />
                {items.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="text-sm font-semibold text-red-600 hover:underline"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {isLoading ? (
                <GridSkeletonLoader count={4} />
            ) : items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {items.map((item) => (
                        <ItemCard key={item.id} item={item} user={null} initialHasLiked={true} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-text-secondary bg-gray-50 rounded-lg mt-6">
                    <h3 className="font-semibold text-lg text-text-primary">You haven't liked any items yet.</h3>
                    <p className="mt-1">Click the heart icon on an item to save it here.</p>
                </div>
            )}
        </div>
    );
}