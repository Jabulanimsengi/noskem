import { createClient } from '../../utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import ItemDetails from './ItemDetails';
import PurchaseActionsClient from './PurchaseActionsClient';
import ItemCarousel from '@/app/components/ItemCarousel';
import ViewTracker from './ViewTracker';
import { type Category, type ItemWithProfile } from '@/types';

export type ItemDataWithCategory = ItemWithProfile & {
  categories: Category | null;
};

interface ItemDetailPageProps {
  params: {
    id: string;
  };
}

// Main component to fetch and display the item details
export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const supabase = await createClient();
  
  const itemId = params?.id;
  if (!itemId) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  // FIX: Explicitly select 'location_description' in the query
  const { data: itemData, error } = await supabase
    .from('items')
    .select(`
      *,
      location_description, 
      profiles:seller_id (username, avatar_url, id),
      categories (name)
    `)
    .eq('id', itemId)
    .single();

  if (error || !itemData) {
    notFound();
  }

  const item = itemData as ItemDataWithCategory & { location_description: string | null };
  const isOwner = user?.id === item.seller_id;
  const canPurchase = user && !isOwner && item.status === 'available';

  const { data: similarItemsData } = await supabase
    .from('items')
    .select('*, profiles:seller_id(username, avatar_url)')
    .eq('category_id', item.category_id)
    .neq('id', item.id)
    .eq('status', 'available')
    .limit(10);
  
  const similarItems = (similarItemsData || []) as ItemWithProfile[];

  return (
    <>
      <Suspense fallback={null}>
        <ViewTracker itemId={item.id} />
      </Suspense>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* The 'item' prop now satisfies the requirements of ItemDetails */}
            <ItemDetails item={item} />
          </div>
          <div className="space-y-6">
            {canPurchase ? (
              <PurchaseActionsClient item={item} user={user} />
            ) : (
              <div className="bg-surface rounded-xl shadow-md p-6 text-center">
                <p className="font-semibold text-text-secondary">
                  {isOwner ? "This is your listing." : "This item is not available for purchase."}
                </p>
              </div>
            )}
          </div>
        </div>
        {similarItems.length > 0 && (
          <div className='border-t pt-12 mt-12'>
            <ItemCarousel title="Similar Items" items={similarItems} user={user} />
          </div>
        )}
      </div>
    </>
  );
}