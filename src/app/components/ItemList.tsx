// src/app/components/ItemList.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';
import ItemCard from './ItemCard';
import GridSkeletonLoader from './skeletons/GridSkeletonLoader';

interface ItemListProps {
  user: User | null;
  initialLikedItemIds?: number[];
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function ItemList({ user, initialLikedItemIds = [], searchParams = {} }: ItemListProps) {
  const [items, setItems] = useState<ItemWithProfile[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { ref, inView } = useInView({ threshold: 0.5 });

  const stableSearchParams = useMemo(() => JSON.stringify(searchParams), [searchParams]);

  const loadMoreItems = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    const query = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        query.append(key, Array.isArray(value) ? value.join(',') : value);
      }
    });
    query.append('page', String(page + 1));

    try {
      const res = await fetch(`/api/items?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch items');
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        setItems((prev) => [...prev, ...data.items]);
        setPage((prev) => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error(error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, searchParams]);

  useEffect(() => {
    if (inView && hasMore) {
      loadMoreItems();
    }
  }, [inView, hasMore, loadMoreItems]);
  
  useEffect(() => {
    const fetchInitialItems = async () => {
        setIsLoading(true);
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
          if (!res.ok) throw new Error('Failed to fetch initial items');
          const data = await res.json();
          setItems(data.items || []);
          if (!data.items || data.items.length < 20) {
            setHasMore(false);
          }
        } catch (error) {
          console.error(error);
          setItems([]);
          setHasMore(false);
        } finally {
          setIsLoading(false);
        }
    };
    fetchInitialItems();
  }, [stableSearchParams]);

  return (
    <div>
      {items.length > 0 ? (
        // MOBILE OPTIMIZATION: Changed grid to 2 columns on mobile, 3 on medium screens, and 4 on large screens.
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
      ) : !isLoading ? (
        <p className="text-center py-12 text-gray-500">No items found matching your criteria.</p>
      ) : null}

      {/* Show initial skeleton loader only on first load */}
      {isLoading && page === 1 && <GridSkeletonLoader count={8} />}

      {/* This ref triggers loading more items when it becomes visible */}
      {hasMore && !isLoading && (
        <div ref={ref} className="text-center py-8">
          <span className="text-gray-500">Loading more items...</span>
        </div>
      )}
    </div>
  );
}
