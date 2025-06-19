// src/app/page.tsx
import { createClient } from './utils/supabase/server';
import ItemCard from './components/ItemCard';
import { type Category } from '@/types';
import CategoryFilter from './components/CategoryFilter';
import CreditPackagesSection from './components/CreditPackagesSection';

interface HomePageProps {
  searchParams: {
    category?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient();
  const selectedCategorySlug = searchParams.category;

  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
  const categories: Category[] = categoriesData || [];

  let query = supabase
    .from('items')
    .select(`id, title, buy_now_price, images, seller_id, profiles (username, avatar_url)`)
    .eq('status', 'available');

  if (selectedCategorySlug) {
    const selectedCategory = categories.find(c => c.slug === selectedCategorySlug);
    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory.id);
    }
  }

  const { data: items, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching items:", error.message);
  }

  return (
    <>
      <section className="bg-gradient-to-r from-brand to-brand-dark text-white text-center py-20 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Discover Amazing Deals</h1>
        <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">Buy and sell with confidence on the marketplace that connects communities.</p>
      </section>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-brand-dark">Browse Our Marketplace</h2>
            <p className="text-lg text-text-secondary mt-2">Find exactly what you're looking for.</p>
        </div>

        <CategoryFilter categories={categories} />

        {items && items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item as any} />
            ))}
          </div>
        ) : (
          <p className="text-center text-text-secondary py-10">No items found for this category.</p>
        )}
      </div>
      
      <CreditPackagesSection />
    </>
  );
}