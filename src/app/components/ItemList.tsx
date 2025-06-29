'use client'; 

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ItemCard from './ItemCard';
import GridSkeletonLoader from './skeletons/GridSkeletonLoader';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';
import { FaSpinner } from 'react-icons/fa';

interface ItemListProps {
  user: User | null;
  initialLikedItemIds: number[]; // Add this prop
}

function ItemListComponent({ user, initialLikedItemIds }: ItemListProps) {
  const searchParams = useSearchParams();
  
  const [items, setItems] = useState<ItemWithProfile[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchItems = useCallback(async (pageNum: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNum.toString());
    const response = await fetch(`/api/items?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch items');
    }
    return response.json();
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    fetchItems(1).then(data => {
      setItems(data.items || []);
      setHasMore(data.hasMore || false);
      setIsLoading(false);
    }).catch(error => {
      console.error(error);
      setIsLoading(false);
    });
  }, [searchParams, fetchItems]);

  const loadMoreItems = async () => {
    if (isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    const nextPage = page + 1;
    
    fetchItems(nextPage).then(data => {
      setItems(prevItems => [...prevItems, ...(data.items || [])]);
      setPage(nextPage);
      setHasMore(data.hasMore || false);
    }).catch(error => {
      console.error(error);
    }).finally(() => {
      setIsFetchingMore(false);
    });
  };

  if (isLoading) {
    return <GridSkeletonLoader count={8} />;
  }

  return (
    <>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard 
              key={`${item.id}-${item.created_at}`} 
              item={item as ItemWithProfile} 
              user={user}
              initialHasLiked={initialLikedItemIds.includes(item.id)} // Pass down the like status
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-text-secondary py-10">No items found matching your criteria.</p>
      )}

      {hasMore && (
        <div className="text-center mt-12">
          <button
            onClick={loadMoreItems}
            disabled={isFetchingMore}
            className="px-6 py-3 font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark disabled:bg-gray-400 flex items-center justify-center gap-2 mx-auto"
          >
            {isFetchingMore && <FaSpinner className="animate-spin" />}
            {isFetchingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </>
  );
}

export default function ItemList(props: ItemListProps) {
  return (
    <Suspense fallback={<GridSkeletonLoader count={8} />}>
      <ItemListComponent {...props} />
    </Suspense>
  )
}