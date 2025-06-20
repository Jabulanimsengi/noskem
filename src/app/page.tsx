import { createClient } from './utils/supabase/server';
import { Suspense } from 'react';
import { type User } from '@supabase/supabase-js';
import { type Category } from '@/types';
import CategoryFilter from './components/CategoryFilter';
import CreditPackagesSection from './components/CreditPackagesSection';
import ItemCarousel from './components/ItemCarousel';
import { HeroSection } from './components/HeroSection';
import ItemList from './components/ItemList';
import GridSkeletonLoader from './components/skeletons/GridSkeletonLoader';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // FIX: Accessing the search param in a way that is compatible with Next.js dynamic rendering
  const selectedCategorySlug = typeof searchParams.category === 'string' ? searchParams.category : undefined;

  const [
    categoriesRes,
    popularItemsRes,
    recentlySoldRes,
  ] = await Promise.all([
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase.from('items').select(`*, profiles (username, avatar_url)`).eq('status', 'available').order('view_count', { ascending: false }).limit(10),
    supabase.from('items').select(`*, profiles (username, avatar_url)`).eq('status', 'sold').order('updated_at', { ascending: false }).limit(10)
  ]);

  const categories: Category[] = categoriesRes.data || [];
  const popularItems = popularItemsRes.data || [];
  const recentlySoldItems = recentlySoldRes.data || [];

  return (
    <>
      <HeroSection />

      <div id="listings-section" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {popularItems.length > 0 && (
          <div className='border-t pt-8 mt-8'>
            <ItemCarousel title="Popular Items" items={popularItems as any} user={user} />
          </div>
        )}

        {recentlySoldItems.length > 0 && (
           <div className='border-t pt-8 mt-8'>
             <ItemCarousel title="Recently Sold" items={recentlySoldItems as any} user={user} />
           </div>
        )}
        
        <div className="py-16 border-t mt-8">
          <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-brand-dark">Browse All Items</h2>
              <p className="text-lg text-text-secondary mt-2">Find exactly what you're looking for.</p>
          </div>
          <CategoryFilter categories={categories} />
          <Suspense fallback={<GridSkeletonLoader count={8} />}>
            <ItemList categorySlug={selectedCategorySlug} user={user} />
          </Suspense>
        </div>
      </div>
      
      <CreditPackagesSection user={user} />
    </>
  );
}