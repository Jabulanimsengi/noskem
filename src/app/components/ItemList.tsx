'use client'; // This marks the component as a Client Component

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ItemCard from './ItemCard';
import GridSkeletonLoader from './skeletons/GridSkeletonLoader';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';

// This component no longer accepts categorySlug or searchParams
interface ItemListProps {
  user: User | null;
}

function ItemListComponent({ user }: ItemListProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  const [items, setItems] = useState<ItemWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
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
  }, [category]); 

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

// Wrap the component in Suspense to handle the useSearchParams hook correctly
export default function ItemList(props: ItemListProps) {
  return (
    <Suspense fallback={<GridSkeletonLoader count={8} />}>
      <ItemListComponent {...props} />
    </Suspense>
  )
}