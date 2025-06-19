// src/app/page.tsx

import { createClient } from './utils/supabase/server';
import ItemCard from './components/ItemCard';
import { type Category } from '@/types';
import CategoryFilter from './components/CategoryFilter';
import CreditPackagesSection from './components/CreditPackagesSection';
import ItemCarousel from './components/ItemCarousel';
import { HeroSection } from './components/HeroSection';

interface HomePageProps {
  searchParams: {
    category?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient();
  const selectedCategorySlug = searchParams.category;

  // --- Fetch data for all sections at the same time ---
  const [
    categoriesRes,
    popularItemsRes,
    recentlySoldRes,
  ] = await Promise.all([
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase.from('items').select(`*, profiles (username, avatar_url)`).eq('status', 'available').order('view_count', { ascending: false }).limit(10),
    supabase.from('items').select(`*, profiles (username, avatar_url)`).eq('status', 'sold').order('created_at', { ascending: false }).limit(10)
  ]);

  const categories: Category[] = categoriesRes.data || [];
  const popularItems = popularItemsRes.data || [];
  const recentlySoldItems = recentlySoldRes.data || [];

  // Logic for the main item grid with category filtering
  let mainItemsQuery = supabase
    .from('items')
    .select(`*, profiles (username, avatar_url)`)
    .eq('status', 'available');

  if (selectedCategorySlug) {
    const selectedCategory = categories.find(c => c.slug === selectedCategorySlug);
    if (selectedCategory) {
      mainItemsQuery = mainItemsQuery.eq('category_id', selectedCategory.id);
    }
  }
  
  const { data: mainItems } = await mainItemsQuery.order('created_at', { ascending: false });

  return (
    <>
      <HeroSection />

      <div id="listings-section" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 divide-y divide-gray-200">
        
        {/* Popular Items Carousel */}
        <ItemCarousel title="Popular Items" items={popularItems as any} />

        {/* Recently Sold Items Carousel */}
        <ItemCarousel title="Recently Sold" items={recentlySoldItems as any} />
        
        {/* Main Marketplace Section */}
        <div className="py-16">
          <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-brand-dark">Browse All Items</h2>
              <p className="text-lg text-text-secondary mt-2">Find exactly what you're looking for.</p>
          </div>
          <CategoryFilter categories={categories} />
          {mainItems && mainItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mainItems.map((item) => (
                <ItemCard key={item.id} item={item as any} />
              ))}
            </div>
          ) : (
            <p className="text-center text-text-secondary py-10">No items found for this category.</p>
          )}
        </div>
      </div>
      
      <CreditPackagesSection />
    </>
  );
}