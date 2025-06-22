/**
 * CODE REVIEW UPDATE
 * ------------------
 * This file has been updated based on the AI code review.
 *
 * Changes Made:
 * - Suggestion #9 (Performance): Replaced `force-dynamic` with `revalidate` to allow for caching while keeping data fresh.
 * - Suggestion #25 (Performance): Fetched `credit_packages` on the server and passed them as props to `CreditPackagesSection`.
 * - Suggestion #31 (Performance): Fetched the initial list of all items (`allItems`) on the server to pass to `ItemList`.
 */
import { createClient } from './utils/supabase/server';
import { Suspense } from 'react';
import { Category, ItemWithProfile } from '@/types';
import CategoryFilter from './components/CategoryFilter';
import CreditPackagesSection from './components/CreditPackagesSection';
import ItemCarousel from './components/ItemCarousel';
import { HeroSection } from './components/HeroSection';
import ItemList from './components/ItemList';
import GridSkeletonLoader from './components/skeletons/GridSkeletonLoader';

// FIX: This line has been removed to prevent caching and ensure the user's auth state is always fresh.
// export const revalidate = 3600; 

type CreditPackage = {
    id: number;
    name: string;
    credits_amount: number;
    price_zar: number;
    bonus_credits: number;
    is_popular: boolean;
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all initial data concurrently
  const [
    categoriesRes,
    featuredItemsRes,
    popularItemsRes,
    recentlySoldRes,
    creditPackagesRes, // Suggestion #25: Fetch packages on the server
    allItemsRes,       // Suggestion #31: Fetch initial items on the server
  ] = await Promise.all([
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase.from('items').select(`*, profiles (username, avatar_url)`).eq('is_featured', true).limit(10),
    supabase.from('items').select(`*, profiles (username, avatar_url)`).eq('status', 'available').order('view_count', { ascending: false }).limit(10),
    supabase.from('items').select(`*, profiles (username, avatar_url)`).eq('status', 'sold').order('updated_at', { ascending: false }).limit(10),
    supabase.from('credit_packages').select('*').order('price_zar', { ascending: true }),
    supabase.from('items').select('*, profiles(username, avatar_url)').eq('status', 'available').order('created_at', { ascending: false }).limit(12),
  ]);

  const categories: Category[] = categoriesRes.data || [];
  const featuredItems: ItemWithProfile[] = featuredItemsRes.data || [];
  const popularItems: ItemWithProfile[] = popularItemsRes.data || [];
  const recentlySoldItems: ItemWithProfile[] = recentlySoldRes.data || [];
  const creditPackages: CreditPackage[] = creditPackagesRes.data || [];
  const allItems: ItemWithProfile[] = allItemsRes.data || [];

  return (
    <>
      <HeroSection />
      <div id="listings-section" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {featuredItems.length > 0 && (
          <div className='pt-8 mt-8'>
            <ItemCarousel title="Featured Items" items={featuredItems} user={user} />
          </div>
        )}
        {popularItems.length > 0 && (
          <div className='border-t pt-8 mt-8'>
            <ItemCarousel title="Popular Items" items={popularItems} user={user} />
          </div>
        )}
        {recentlySoldItems.length > 0 && (
           <div className='border-t pt-8 mt-8'>
             <ItemCarousel title="Recently Sold" items={recentlySoldItems} user={user} />
           </div>
        )}
        <div className="py-16 border-t mt-8">
          <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-brand-dark">Browse All Items</h2>
              <p className="text-lg text-text-secondary mt-2">Find exactly what you're looking for.</p>
          </div>
          <CategoryFilter categories={categories} />
          
          {/* Suggestion #31: Pass server-fetched items to a presentational ItemList.
              ItemList will now render immediately without a skeleton loader for the initial view.
              The Suspense is kept for when category filters are applied, which trigger a client-side fetch.
          */}
          <Suspense fallback={<GridSkeletonLoader count={8} />}>
            <ItemList user={user} initialItems={allItems} />
          </Suspense>
        </div>
      </div>
      {/* Suggestion #25: Pass server-fetched packages as props */}
      <CreditPackagesSection user={user} packages={creditPackages} />
    </>
  );
}