import { createClient } from '../utils/supabase/server';
import ItemCard from '../components/ItemCard';
import SortFilter from './SortFilter';
import SidebarFilters from './SidebarFilters';
import { Suspense } from 'react';
import { type ItemWithProfile } from '@/types';

interface SearchPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// This tells Next.js to always render this page dynamically on the server.
export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // FIX: Access searchParams in a more robust way
  const searchQuery = searchParams.q ?? '';
  const sortParam = searchParams.sort ?? 'created_at.desc';
  const minPriceParam = searchParams.min_price;
  const maxPriceParam = searchParams.max_price;
  const conditionsParam = searchParams.condition;
  
  const [sortColumn, sortOrder] = Array.isArray(sortParam) 
    ? sortParam[0].split('.') 
    : sortParam.split('.');

  // Build the database query
  let query = supabase
    .from('items')
    .select('*, profiles(username, avatar_url)')
    .eq('status', 'available');

  // Apply filters based on the search parameters
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

  // Apply sorting
  query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  // FIX: Correctly type the fetched items
  const items: ItemWithProfile[] = data || [];

  if (error) {
    console.error('Search error:', error.message);
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Search Results</h1>
        {typeof searchQuery === 'string' && searchQuery && (
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
            <span className="text-sm text-text-secondary">{items.length} items found</span>
            <Suspense fallback={null}>
              <SortFilter />
            </Suspense>
          </div>
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item) => (
                // No longer need to cast the type here
                <ItemCard key={item.id} item={item} user={user} />
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