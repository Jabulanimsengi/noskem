// src/app/page.tsx

import { createClient } from './utils/supabase/server';
import { Suspense } from 'react';
import { ItemWithProfile } from '@/types';
import CreditPackagesSection from './components/CreditPackagesSection';
import ItemCarousel from './components/ItemCarousel';
import { HeroSection } from './components/HeroSection';
import HomepageSkeleton from './components/skeletons/HomepageSkeleton';
import ItemList from './components/ItemList';
import ServiceCarousel from './components/ServiceCarousel';
import { type ServiceProviderForCard } from './components/ServiceProviderCard';

export const revalidate = 60; 

type CreditPackage = {
    id: number;
    name: string;
    credits_amount: number;
    price_zar: number;
    bonus_credits: number;
    is_popular: boolean;
};

async function HomepageContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let likedItemIds: number[] = [];
  if (user) {
      const { data: likes } = await supabase.from('likes').select('item_id').eq('user_id', user.id);
      if (likes) {
          likedItemIds = likes.map((like: { item_id: number }) => like.item_id);
      }
  }

  const selectQuery = '*, profiles!seller_id(*)';

  const [
    featuredItemsRes,
    popularItemsRes,
    recentlyListedRes,
    recentlySoldRes,
    creditPackagesRes,
    // --- THIS QUERY FETCHES YOUR APPROVED & FEATURED SERVICES ---
    featuredServicesRes, 
  ] = await Promise.all([
    supabase.from('items').select(selectQuery).eq('is_featured', true).in('status', ['available', 'pending_payment']).limit(10),
    supabase.from('items').select(selectQuery).in('status', ['available', 'pending_payment']).order('view_count', { ascending: false, nullsFirst: false }).limit(10),
    supabase.from('items').select(selectQuery).in('status', ['available', 'pending_payment']).order('created_at', { ascending: false }).limit(10),
    supabase.from('items').select(selectQuery).eq('status', 'sold').order('updated_at', { ascending: false }).limit(10),
    supabase.from('credit_packages').select('*').order('price_zar', { ascending: true }),
    // --- This query fetches approved and featured service providers ---
    supabase.from('service_providers').select('*, service_categories ( name )').eq('status', 'approved').eq('is_featured', true).limit(5),
  ]);

  const featuredItems: ItemWithProfile[] = (featuredItemsRes.data || []) as ItemWithProfile[];
  const popularItems: ItemWithProfile[] = (popularItemsRes.data || []) as ItemWithProfile[];
  const recentlyListedItems: ItemWithProfile[] = (recentlyListedRes.data || []) as ItemWithProfile[];
  const recentlySoldItems: ItemWithProfile[] = (recentlySoldRes.data || []) as ItemWithProfile[];
  const creditPackages: CreditPackage[] = creditPackagesRes.data || [];
  const featuredServices: ServiceProviderForCard[] = (featuredServicesRes.data || []) as ServiceProviderForCard[];

  return (
    <>
      <HeroSection />
      <div id="listings-section" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {featuredItems.length > 0 && (
          <div className='pt-4 mt-4 sm:pt-8 sm:mt-8'>
            <ItemCarousel title="⭐ Featured Items" items={featuredItems} user={user} likedItemIds={likedItemIds} />
          </div>
        )}

        {/* --- THIS SECTION DISPLAYS THE SERVICE CAROUSEL --- */}
        {featuredServices.length > 0 && (
          <div className='border-t pt-4 mt-4 sm:pt-8 sm:mt-8'>
            <ServiceCarousel title="Verified Local Services" providers={featuredServices} viewAllLink="/services" />
          </div>
        )}

        {popularItems.length > 0 && (
          <div className='border-t pt-4 mt-4 sm:pt-8 sm:mt-8'>
            <ItemCarousel title="Popular Now" items={popularItems} user={user} likedItemIds={likedItemIds} />
          </div>
        )}
        
        {recentlyListedItems.length > 0 && (
          <div className='border-t pt-4 mt-4 sm:pt-8 sm:mt-8'>
            <ItemCarousel title="Recently Listed" items={recentlyListedItems} user={user} likedItemIds={likedItemIds} />
          </div>
        )}
        
        {recentlySoldItems.length > 0 && (
            <div className='border-t pt-4 mt-4 sm:pt-8 sm:mt-8'>
              <ItemCarousel title="Recently Sold" items={recentlySoldItems} user={user} likedItemIds={likedItemIds} />
            </div>
        )}
        
        <div className="py-8 sm:py-12 border-t mt-6 sm:mt-8">
          <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">Browse All Items</h2>
              <p className="text-base sm:text-lg text-text-secondary mt-2">Find exactly what you&apos;re looking for.</p>
          </div>
          
          <ItemList user={user} initialLikedItemIds={likedItemIds} />
        </div>

      </div>
      <CreditPackagesSection user={user} packages={creditPackages} />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomepageSkeleton />}>
      <HomepageContent />
    </Suspense>
  );
}