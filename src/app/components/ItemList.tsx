'use client'; 

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ItemCard from './ItemCard';
import GridSkeletonLoader from './skeletons/GridSkeletonLoader';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';

// FIX: This component no longer accepts `initialItems` as a prop.
interface ItemListProps {
  user: User | null;
}

function ItemListComponent({ user }: ItemListProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  const [items, setItems] = useState<ItemWithProfile[]>([]);
  // FIX: isLoading now defaults to `true` to show the skeleton on initial load.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // FIX: This effect now runs on initial load AND when the category changes.
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        // Build the URL based on whether a category is selected.
        const url = category ? `/api/items?category=${category}` : '/api/items';
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
  }, [category]); // The effect re-runs whenever the 'category' search param changes.

  if (isLoading) {
    return <GridSkeletonLoader count={8} />;
  }

  return (
    <>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item as ItemWithProfile} user={user} />
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