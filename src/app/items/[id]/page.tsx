// src/app/items/[id]/page.tsx
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { type ItemWithProfile, type Category } from '@/types'; // Use ItemWithProfile
import ItemDetails from './ItemDetails';
import SellerSidebar from './SellerSidebar';
import { Suspense } from 'react';
import ItemCarousel from '@/app/components/ItemCarousel';
import GridSkeletonLoader from '@/app/components/skeletons/GridSkeletonLoader';
import ItemCreationToast from './ItemCreationToast';
import BackButton from '@/app/components/BackButton';

export const dynamic = 'force-dynamic';

// This local type now correctly uses ItemWithProfile to include badges
export type ItemDataWithCategory = ItemWithProfile & {
  categories: Category | null;
};

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: item } = await supabase.from('items').select('title, description').eq('id', params.id).single();

  if (!item) {
    return {
      title: 'Item Not Found',
    };
  }

  return {
    title: `${item.title} | Noskem Marketplace`,
    description: item.description,
  };
}

async function RelatedItems({ categoryId, currentItemId }: { categoryId: number | null, currentItemId: number }) {
  if (!categoryId) return null;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // This query also needs to be updated to fetch badges for related items
  const { data: relatedItemsData } = await supabase
    .from('items')
    .select(`
        *,
        profiles:seller_id (
            *,
            user_badges (
                badge_type
            )
        )
    `)
    .eq('category_id', categoryId)
    .neq('id', currentItemId)
    .eq('status', 'available')
    .limit(4);

  const relatedItems = (relatedItemsData as ItemWithProfile[]) || [];

  if (relatedItems.length === 0) {
    return null;
  }
  
  let likedItemIds: number[] = [];
  if (user) {
    const { data: likes } = await supabase.from('likes').select('item_id').eq('user_id', user.id);
    if (likes) {
      likedItemIds = likes.map(like => like.item_id);
    }
  }

  return (
    <div className="mt-12">
      <ItemCarousel 
        title="Related Items"
        items={relatedItems}
        user={user}
        likedItemIds={likedItemIds}
      />
    </div>
  );
}


export default async function ItemPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // --- THIS IS THE FIX ---
  // The select query now explicitly fetches user_badges from the related profiles table.
  const { data: itemData, error } = await supabase
    .from('items')
    .select(`
        *,
        categories:category_id (*),
        profiles:seller_id (
            *,
            user_badges (
                badge_type
            )
        )
    `)
    .eq('id', params.id)
    .single();

  if (error) {
    console.error('Database Error fetching item:', error.message);
    notFound();
  }
  
  if (!itemData) {
    notFound();
  }

  await supabase.rpc('increment_view_count', { item_id_to_increment: itemData.id });

  return (
    <>
      <Suspense fallback={null}>
        <ItemCreationToast />
      </Suspense>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* The cast now works because itemData includes badges */}
            <ItemDetails item={itemData as ItemDataWithCategory} />
          </div>
          <div className="lg:col-span-1">
            <SellerSidebar item={itemData as ItemDataWithCategory} user={user} />
          </div>
        </div>
        
        <Suspense fallback={<GridSkeletonLoader count={4} />}>
          <RelatedItems categoryId={itemData.category_id} currentItemId={itemData.id} />
        </Suspense>
      </div>
    </>
  );
}