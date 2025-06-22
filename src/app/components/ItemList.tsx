/**
 * CODE REVIEW UPDATE
 * ------------------
 * This file has been updated based on the AI code review.
 *
 * Change Made:
 * - Suggestion #31 (Performance): Refactored the component to accept `initialItems` from a Server Component parent.
 * It now only fetches data on the client-side when the category search param changes, improving initial page load performance.
 */
'use client'; 

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ItemCard from './ItemCard';
import GridSkeletonLoader from './skeletons/GridSkeletonLoader';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';

interface ItemListProps {
  user: User | null;
  initialItems: ItemWithProfile[];
}

function ItemListComponent({ user, initialItems }: ItemListProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  const [items, setItems] = useState<ItemWithProfile[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only fetch if a category is selected in the URL.
    // The initial, "all items" state is provided by the server.
    if (category) {
      const fetchItems = async () => {
        setIsLoading(true);
        try {
          const url = `/api/items?category=${category}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Failed to fetch items');
          }
          const data = await response.json();
          setItems(data);
        } catch (error) {
          console.error(error);
          setItems([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchItems();
    } else {
      // If the category filter is cleared, revert to the initial server-provided items.
      setItems(initialItems);
    }
  }, [category, initialItems]);

  if (isLoading) {
    return <GridSkeletonLoader count={8} />;
  }

  return (
    <>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} user={user} />
          ))}
        </div>
      ) : (
        <p className="text-center text-text-secondary py-10">No items found.</p>
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