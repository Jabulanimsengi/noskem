import { createClient } from './utils/supabase/server';
import { Suspense } from 'react';
import { type Category } from '@/types';
import CategoryFilter from './components/CategoryFilter';
import CreditPackagesSection from './components/CreditPackagesSection';
import ItemCarousel from './components/ItemCarousel';
import { HeroSection } from './components/HeroSection';
import ItemList from './components/ItemList';
import GridSkeletonLoader from './components/skeletons/GridSkeletonLoader';

// --- FIX IS HERE ---
// This line tells Next.js to always render this page dynamically.
export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: {
    category?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient();
  const selectedCategorySlug = searchParams.category;

  // Data fetching remains the same
  const categoriesRes = await supabase.from('categories').select('*').order('name', { ascending: true });
  const popularItemsRes = await supabase.from('items').select(`*, profiles (username, avatar_url)`).eq('status', 'available').order('view_count', { ascending: false }).limit(10);
  const recentlySoldRes = await supabase.from('items').select(`*, profiles (username, avatar_url)`).eq('status', 'sold').order('updated_at', { ascending: false }).limit(10);

  const categories: Category[] = categoriesRes.data || [];
  const popularItems = popularItemsRes.data || [];
  const recentlySoldItems = recentlySoldRes.data || [];

  return (
    <>
      <HeroSection />

      <div id="listings-section" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {popularItems.length > 0 && (
          <div className='border-t pt-8 mt-8'>
            <ItemCarousel title="Popular Items" items={popularItems as any} />
          </div>
        )}

        {recentlySoldItems.length > 0 && (
           <div className='border-t pt-8 mt-8'>
             <ItemCarousel title="Recently Sold" items={recentlySoldItems as any} />
           </div>
        )}
        
        <div className="py-16 border-t mt-8">
          <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-brand-dark">Browse All Items</h2>
              <p className="text-lg text-text-secondary mt-2">Find exactly what you're looking for.</p>
          </div>
          <CategoryFilter categories={categories} />
          <Suspense fallback={<GridSkeletonLoader count={8} />}>
            <ItemList categorySlug={selectedCategorySlug} />
          </Suspense>
        </div>
      </div>
      
      <CreditPackagesSection />
    </>
  );
}