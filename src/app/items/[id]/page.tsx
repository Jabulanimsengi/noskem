import { createClient } from '../../utils/supabase/server';
import { notFound } from 'next/navigation';
import ImageGallery from '../../components/ImageGallery';
import ViewTracker from './ViewTracker';
import ItemLocationClient from './ItemLocationClient';
import Link from 'next/link';
import { type ItemWithProfile } from '@/types';
import { FaUser } from 'react-icons/fa';
import PurchaseActionsClient from './PurchaseActionsClient';

interface ItemDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const supabase = await createClient();
  const itemId = params.id; // Correctly access the id here

  const { data: { user } } = await supabase.auth.getUser();

  const { data: itemData, error } = await supabase
    .from('items')
    .select(`*, category:categories(name), profiles(id, username, avatar_url)`)
    .eq('id', itemId) // Use the variable
    .single();

  if (error || !itemData) {
    notFound();
  }
  
  // Cast to the correct type after fetching
  const item = itemData as unknown as ItemWithProfile;

  const formatCondition = (condition: string) => {
    return condition ? condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
  };
  
  const sellerUsername = item.profiles?.username || 'Anonymous';
  const isOwner = user?.id === item.seller_id;

  return (
    <>
      <ViewTracker itemId={item.id} />
    
      <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          
          <div>
            <ImageGallery images={item.images as string[] | null} itemTitle={item.title} />
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-surface rounded-xl shadow-md p-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">{item.title}</h1>
              <div className="text-sm text-text-secondary mt-2">
                Sold by{' '}
                <Link href={`/sellers/${sellerUsername}`} className="font-semibold text-brand hover:underline">
                  {sellerUsername}
                </Link>
              </div>
              <div className="mt-6">
                <p className="text-4xl font-bold text-brand">
                  {item.buy_now_price ? `R${item.buy_now_price.toFixed(2)}` : 'Make an Offer'}
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-text-primary">Item Details</h2>
               <div className="flex justify-between border-b pb-2">
                  <span className="text-text-secondary">Condition</span>
                  <span className="font-semibold text-text-primary">{formatCondition(item.condition)}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-text-secondary">Category</span>
                  {/* @ts-ignore - The type from Supabase is sometimes incorrect for this relational query */}
                  <span className="font-semibold text-text-primary">{item.category?.name || 'N/A'}</span>
               </div>
            </div>
            
            <div className="bg-surface rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-text-primary mb-2">Description</h2>
              <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                {item.description || 'No description provided.'}
              </p>
            </div>

            {item.latitude && item.longitude && (
              <ItemLocationClient lat={item.latitude} lng={item.longitude} />
            )}
            
            {!isOwner && item.status === 'available' && (
              <PurchaseActionsClient item={item} user={user} />
            )}

             {isOwner && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
                    <div className="flex">
                        <div className="py-1"><FaUser className="mr-3" /></div>
                        <div>
                            <p className="font-bold">This is your listing.</p>
                            <p className="text-sm">You can manage this item from your dashboard.</p>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
