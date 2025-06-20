import { createClient } from '../utils/supabase/server';
import ItemCard from './ItemCard';
import { type User } from '@supabase/supabase-js';

interface ItemListProps {
  categorySlug?: string;
  user: User | null;
}

export default async function ItemList({ categorySlug, user }: ItemListProps) {
  const supabase = await createClient();
  
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
  
  const { data: mainItems } = await mainItemsQuery.order('created_at', { ascending: false });

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