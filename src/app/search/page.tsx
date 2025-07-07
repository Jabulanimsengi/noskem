// src/app/search/page.tsx

import { createClient } from '@/utils/supabase/server';
import { type User } from '@supabase/supabase-js';
import ItemList from '@/app/components/ItemList';
import SidebarFilters from './SidebarFilters';
import SortFilter from './SortFilter';
import SaveSearchButton from './SaveSearchButton';
import { Suspense } from 'react';
// --- FIX: Corrected the import for the default export ---
import GridSkeletonLoader from '../components/skeletons/GridSkeletonLoader';

// This is a server component that fetches the initial search results
async function SearchResults({
  searchParams,
  user
}: {
  searchParams: { [key: string]: string | string[] | undefined };
  user: User | null;
}) {
  const supabase = createClient();

  let likedItemIds: number[] = [];
  if (user) {
    const { data: likes } = await supabase
      .from('likes')
      .select('item_id')
      .eq('user_id', user.id);
    if (likes) {
      likedItemIds = likes.map((like) => like.item_id);
    }
  }

  return (
    <Suspense fallback={<GridSkeletonLoader count={6} />}>
      {/* The ItemList component handles fetching and displaying items */}
      <ItemList
        user={user}
        initialLikedItemIds={likedItemIds}
        searchParams={searchParams}
      />
    </Suspense>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const searchQuery = (searchParams?.q as string) || '';

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar for Filters */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <h2 className="text-xl font-bold">Filters</h2>
            {/* --- FIX: Removed the 'categories' prop as your component doesn't use it --- */}
            <SidebarFilters />
            <SaveSearchButton query={searchQuery} user={user} />
          </div>
        </aside>

        {/* Main Content for Results */}
        <main className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row justify-between items-baseline mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
              {searchQuery ? `Results for "${searchQuery}"` : 'Explore All Items'}
            </h1>
            <div className="mt-4 sm:mt-0">
              <SortFilter />
            </div>
          </div>
          <SearchResults searchParams={searchParams} user={user} />
        </main>
      </div>
    </div>
  );
}
