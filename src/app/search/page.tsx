import { createClient } from '../utils/supabase/server';
import ItemCard from '../components/ItemCard';
import SortFilter from './SortFilter';
import SidebarFilters from './SidebarFilters';
import { Suspense } from 'react';
import { type ItemWithProfile } from '@/types'; // FIX: Import strong type

interface SearchPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q : '';
  const sortParam = typeof searchParams.sort === 'string' ? searchParams.sort : 'created_at.desc';
  const minPrice = typeof searchParams.min_price === 'string' ? parseFloat(searchParams.min_price) : undefined;
  const maxPrice = typeof searchParams.max_price === 'string' ? parseFloat(searchParams.max_price) : undefined;
  const conditions = Array.isArray(searchParams.condition) ? searchParams.condition : (typeof searchParams.condition === 'string' ? [searchParams.condition] : []);
  
  const [sortColumn, sortOrder] = sortParam.split('.');

  let query = supabase
    .from('items')
    .select('*, profiles(username, avatar_url)')
    .eq('status', 'available');

  if (searchQuery) {
    query = query.textSearch('fts', searchQuery, { type: 'plain', config: 'english' });
  }
  if (minPrice) {
    query = query.gte('buy_now_price', minPrice);
  }
  if (maxPrice) {
    query = query.lte('buy_now_price', maxPrice);
  }
  if (conditions.length > 0) {
    query = query.in('condition', conditions);
  }

  query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

  const { data: items, error } = await query;

  if (error) {
    console.error('Search error:', error.message);
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Search Results</h1>
        {searchQuery && (
          <p className="text-lg text-text-secondary mt-1">
            Showing results for: <span className="font-semibold text-brand">{searchQuery}</span>
          </p>
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
            <span className="text-sm text-text-secondary">{items?.length || 0} items found</span>
            <Suspense fallback={null}>
              <SortFilter />
            </Suspense>
          </div>
          {items && items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item) => (
                // FIX: Use strong type instead of 'as any'
                <ItemCard key={item.id} item={item as ItemWithProfile} user={user} />
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