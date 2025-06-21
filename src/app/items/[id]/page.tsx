import { createClient } from '../../utils/supabase/server';
import { notFound } from 'next/navigation';
import ImageGallery from '../../components/ImageGallery';
import BuyNowForm from './BuyNowForm';
import ViewTracker from './ViewTracker';
import ItemLocationClient from './ItemLocationClient';
import Link from 'next/link'; // Import Link

interface ItemDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = params; 
  const supabase = await createClient();

  // FIX: The query now fetches the profile's username for the link
  const { data: item, error } = await supabase
    .from('items')
    .select(`*, category:categories(name), profiles (username)`)
    .eq('id', id)
    .single();

  if (error || !item) {
    notFound();
  }

  const formatCondition = (condition: string) => {
    return condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // @ts-ignore
  const sellerUsername = item.profiles?.username || 'Anonymous';

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
                {/* --- FIX: Seller name is now a link to their storefront --- */}
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
                   {/* @ts-ignore */}
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

            {item.buy_now_price && item.buy_now_price > 0 && item.status === 'available' && (
              <div className="bg-surface rounded-xl shadow-md p-6">
                <BuyNowForm
                  itemId={item.id}
                  sellerId={item.seller_id}
                  finalAmount={item.buy_now_price}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}