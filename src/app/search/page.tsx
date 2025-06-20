import { createClient } from '../utils/supabase/server';
import ItemCard from '../components/ItemCard';
import { type Item } from '../components/ItemCard'; // Import the type for a single item

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

// This tells Next.js to always render this page dynamically
export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const searchQuery = searchParams.q || '';
  const supabase = await createClient();

  // Define the type for our results array
  let items: Item[] = [];

  if (searchQuery) {
    // Call the new, simpler database function
    const { data: searchData, error } = await supabase.rpc('search_items', {
      search_term: searchQuery,
    });

    if (error) {
      console.error('Search RPC error:', error.message);
    } else {
      // The data from the RPC will be our items
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
            Please enter a term to search.
          </p>
        )}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            // The ItemCard is designed to handle items that may not have profile data
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        searchQuery && <p className="text-center text-text-secondary py-10">No items found matching your search.</p>
      )}
    </div>
  );
}