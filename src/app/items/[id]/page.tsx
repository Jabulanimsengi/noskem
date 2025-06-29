import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { type Profile, type Item, type Category } from '@/types';
import ItemDetails from './ItemDetails'; // Corrected: default import
import SellerSidebar from './SellerSidebar'; // Corrected: default import

export const dynamic = 'force-dynamic';

// Define the shape of the data needed for this page
export type ItemData = Item & {
  profiles: Profile | null;
  categories: Category | null;
};

// Function to generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
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

export default async function ItemPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: itemData, error } = await supabase
    .from('items')
    .select('*, profiles(*), categories(*)')
    .eq('id', params.id)
    .single();

  if (error || !itemData) {
    notFound();
  }

  // Increment view count
  await supabase.rpc('increment_view_count', { item_id_to_increment: itemData.id });

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ItemDetails item={itemData as ItemData} />
        </div>
        <div className="lg:col-span-1">
          <SellerSidebar item={itemData as ItemData} user={user} />
        </div>
      </div>
    </div>
  );
}