import { createClient } from '../utils/supabase/server';
import ItemCard from './ItemCard';
import { type User } from '@supabase/supabase-js';

interface ItemListProps {
  // --- FIX: Accept the searchParams object instead of a slug string ---
  searchParams: { [key: string]: string | string[] | undefined };
  user: User | null;
}

export default async function ItemList({ searchParams, user }: ItemListProps) {
  const supabase = await createClient();
  
  // --- FIX: Extract the category slug inside this component ---
  const categorySlug = typeof searchParams.category === 'string' ? searchParams.category : undefined;

  let mainItemsQuery = supabase
    .from('items')
    .select(`*, profiles (username, avatar_url)`)
    .eq('status', 'available');

  if (categorySlug) {
    const { data: category } = await supabase.from('categories').select('id').eq('slug', categorySlug).single();
    if (category) {
      mainItemsQuery = mainItemsQuery.eq('category_id', category.id);
    }
  }
  
  const { data: mainItems, error } = await mainItemsQuery.order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching items:", error);
    return <p className="text-center text-red-500 py-10">Could not load items.</p>;
  }

  return (
    <>
      {mainItems && mainItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mainItems.map((item) => (
            <ItemCard key={item.id} item={item as any} user={user} />
          ))}
        </div>
      ) : (
        <p className="text-center text-text-secondary py-10">No items found for this category.</p>
      )}
    </>
  );
}