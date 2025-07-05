import { createClient } from '../utils/supabase/server';
import ItemCard from '../components/ItemCard';
import SortFilter from './SortFilter';
import SidebarFilters from './SidebarFilters';
import { Suspense } from 'react';
import { type ItemWithProfile } from '@/types';
import SaveSearchButton from './SaveSearchButton';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const searchQuery = searchParams.q ?? '';
  const sortParam = searchParams.sort ?? 'created_at.desc';
  const minPriceParam = searchParams.min_price;
  const maxPriceParam = searchParams.max_price;
  const conditionsParam = searchParams.condition;

  const [sortColumn, sortOrder] = Array.isArray(sortParam)
    ? sortParam[0].split('.')
    : sortParam.split('.');

  let query = supabase
    .from('items')
    .select('*, new_item_price, profiles:seller_id(*)')
    // --- FIX: Include items with 'pending_payment' status ---
    .in('status', ['available', 'pending_payment']);

  if (typeof searchQuery === 'string' && searchQuery) {
    query = query.textSearch('fts', searchQuery, { type: 'plain', config: 'english' });
  }
  if (typeof minPriceParam === 'string' && minPriceParam) {
    query = query.gte('buy_now_price', parseFloat(minPriceParam));
  }
  if (typeof maxPriceParam === 'string' && maxPriceParam) {
    query = query.lte('buy_now_price', parseFloat(maxPriceParam));
  }
  if (conditionsParam) {
    const conditions = Array.isArray(conditionsParam) ? conditionsParam : [conditionsParam];
    if (conditions.length > 0) {
        query = query.in('condition', conditions);
    }
  }

  query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  const items: ItemWithProfile[] = data || [];

  if (error) {
    console.error('Search error:', error.message);
  }

  // Get liked item IDs if user is logged in
  let likedItemIds: number[] = [];
  if (user) {
      const { data: likes } = await supabase.from('likes').select('item_id').eq('user_id', user.id);
      if (likes) {
          likedItemIds = likes.map(like => like.item_id);
      }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Search Results</h1>
                {typeof searchQuery === 'string' && searchQuery && (
                <p className="text-lg text-text-secondary mt-1">
                    Showing results for: <span className="font-semibold text-brand">{searchQuery}</span>
                </p>
                )}
            </div>
            {user && typeof searchQuery === 'string' && searchQuery && (
                 <SaveSearchButton query={searchQuery} />
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
            <Suspense fallback={<div>Loading filters...</div>}>
                <SidebarFilters />
            </Suspense>
            </div>
            <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <span className="text-sm text-text-secondary">{items.length} items found</span>
                <Suspense fallback={null}>
                <SortFilter />
                </Suspense>
            </div>
            {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((item) => (
                    <ItemCard key={item.id} item={item} user={user} initialHasLiked={likedItemIds.includes(item.id)} />
                ))}
                </div>
            ) : (
                <p className="text-center text-text-secondary py-16">No items found matching your criteria.</p>
            )}
            </div>
        </div>
    </div>
  );
}
