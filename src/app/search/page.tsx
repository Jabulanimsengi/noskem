import { createClient } from '../utils/supabase/server';
import ItemCard from '../components/ItemCard';
import { type Item } from '../components/ItemCard';

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const searchQuery = searchParams.q || '';
  const supabase = await createClient();

  // --- FIX #1: Fetch the current user's data ---
  const { data: { user } } = await supabase.auth.getUser();

  let items: Item[] = [];

  if (searchQuery) {
    const { data: searchData, error } = await supabase
      .from('items')
      .select('*, profiles(username, avatar_url)') // Fetch profiles with items
      .textSearch('fts', searchQuery, {
        type: 'plain',
        config: 'english',
      })
      .eq('status', 'available')
      .limit(20);

    if (error) {
      console.error('Search error:', error.message);
    } else {
      items = searchData || [];
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">
          Search Results
        </h1>
        {searchQuery ? (
          <p className="text-lg text-text-secondary mt-1">
            Showing results for: <span className="font-semibold text-brand">{searchQuery}</span>
          </p>
        ) : (
          <p className="text-lg text-text-secondary mt-1">
            Please enter a search term to find items.
          </p>
        )}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            // --- FIX #2: Pass the user prop to each ItemCard ---
            <ItemCard key={item.id} item={item} user={user} />
          ))}
        </div>
      ) : (
        searchQuery && <p className="text-center text-text-secondary py-10">No items found matching your search.</p>
      )}
    </div>
  );
}