// src/app/components/ItemList.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';
import ItemCard from './ItemCard';
import GridSkeletonLoader from './skeletons/GridSkeletonLoader';
import { Button } from './Button'; // Import your Button component

interface ItemListProps {
    user: User | null;
    initialLikedItemIds?: number[];
    searchParams?: { [key: string]: string | string[] | undefined };
}

export default function ItemList({ user, initialLikedItemIds = [], searchParams = {} }: ItemListProps) {
    const [items, setItems] = useState<ItemWithProfile[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true); // Start with loading true
    const [error, setError] = useState<string | null>(null); // <-- NEW: Add error state
    const { ref, inView } = useInView({ threshold: 0.5 });

    const stableSearchParams = useMemo(() => JSON.stringify(searchParams), [searchParams]);

    const fetchInitialItems = useCallback(async () => {
        setIsLoading(true);
        setError(null); // <-- NEW: Reset error on each attempt
        setHasMore(true);
        setPage(1);

        const query = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
            if (value) {
                query.append(key, Array.isArray(value) ? value.join(',') : value);
            }
        });
        query.append('page', '1');

        try {
            const res = await fetch(`/api/items?${query.toString()}`);
            if (!res.ok) {
                // Handle non-200 responses as errors
                throw new Error('Failed to fetch items. Please try again.');
            }
            const data = await res.json();
            setItems(data.items || []);
            if (!data.items || data.items.length < 20) {
                setHasMore(false);
            }
        } catch (error) {
            console.error(error);
            setError('Something went wrong. Please check your connection and try again.'); // <-- NEW: Set a user-friendly error message
            setItems([]);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [stableSearchParams]);
    
    // Initial fetch
    useEffect(() => {
        fetchInitialItems();
    }, [fetchInitialItems]);

    const loadMoreItems = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);

        const query = new URLSearchParams();
        Object.entries(JSON.parse(stableSearchParams)).forEach(([key, value]) => {
            if (value) {
                query.append(key, Array.isArray(value) ? String(value) : value as string);
            }
        });
        query.append('page', String(page + 1));

        try {
            const res = await fetch(`/api/items?${query.toString()}`);
            if (!res.ok) throw new Error('Failed to load more items');
            const data = await res.json();

            if (data.items && data.items.length > 0) {
                setItems((prev) => [...prev, ...data.items]);
                setPage((prev) => prev + 1);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error(error);
            // Optionally, show a toast or a small error message for subsequent load failures
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, page, stableSearchParams]);
    
    // Infinite scroll trigger
    useEffect(() => {
        if (inView && hasMore && !isLoading && items.length > 0) {
            loadMoreItems();
        }
    }, [inView, hasMore, isLoading, items.length, loadMoreItems]);

    return (
        <div>
            {/* NEW: Handle the error state */}
            {error && !isLoading && (
                <div className="text-center py-12">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={fetchInitialItems}>
                        Try Again
                    </Button>
                </div>
            )}
            
            {/* Existing Loading and Content Logic */}
            {!error && items.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            user={user}
                            initialHasLiked={initialLikedItemIds.includes(item.id)}
                        />
                    ))}
                </div>
            )}

            {!error && items.length === 0 && !isLoading && (
                <p className="text-center py-12 text-gray-500">No items found matching your criteria.</p>
            )}

            {isLoading && <GridSkeletonLoader count={8} />}

            {hasMore && !isLoading && !error && (
                <div ref={ref} className="text-center py-8">
                    <span className="text-gray-500">Loading more items...</span>
                </div>
            )}
        </div>
    );
}