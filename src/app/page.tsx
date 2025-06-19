// src/app/page.tsx

import { createClient } from './utils/supabase/server';
import ItemCard from './components/ItemCard'; // Import the ItemCard component

export default async function HomePage() {
  const supabase = await createClient();

  // --- UPDATED QUERY ---
  // This now fetches all item data AND the related seller's profile info (username and avatar_url).
  const { data: itemsData, error } = await supabase
    .from('items')
    .select(`
      id, 
      title, 
      buy_now_price, 
      images,
      seller_id,
      profiles (
        username,
        avatar_url
      )
    `)
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching items for homepage:", error);
  }
  
  const items = itemsData || [];

  return (
    <>
      <section className="bg-gradient-to-r from-brand to-brand-dark text-white text-center py-20 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Discover Amazing Deals</h1>
        <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">Buy and sell with confidence on the marketplace that connects communities.</p>
      </section>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-brand-dark mb-12">Featured Items</h2>
        
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* The map now uses the new ItemCard component */}
            {items.map((item) => (
              <ItemCard key={item.id} item={item as any} />
            ))}
          </div>
        ) : (
          <p className="text-center text-text-secondary">No items are currently listed.</p>
        )}
      </div>
    </>
  );
}