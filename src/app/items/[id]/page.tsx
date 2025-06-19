// src/app/items/[id]/page.tsx

import { createClient } from '../../utils/supabase/server';
import { notFound } from 'next/navigation';
import ImageGallery from '../../components/ImageGallery';
import BuyNowForm from './BuyNowForm';
import ViewTracker from './ViewTracker'; // Import the new component

interface ItemDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = params; 
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from('items')
    .select(`*, profiles (username)`)
    .eq('id', id)
    .single();

  if (error || !item) {
    notFound();
  }

  const formatCondition = (condition: string) => {
    return condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <>
      {/* This component will now track the view in the background */}
      <ViewTracker itemId={item.id} />
    
      <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <ImageGallery images={item.images} itemTitle={item.title} />
          </div>
          <div className="flex flex-col gap-6">
            <div className="bg-surface rounded-xl shadow-md p-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">{item.title}</h1>
              <div className="text-sm text-text-secondary mt-2">
                Sold by{' '}
                <span className="font-semibold text-brand">
                  {/* @ts-ignore */}
                  {item.profiles?.username || 'Anonymous'}
                </span>
              </div>
              <div className="mt-6">
                <p className="text-4xl font-bold text-brand">
                  {item.buy_now_price ? `R${item.buy_now_price.toFixed(2)}` : 'Bidding Only'}
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
                  <span className="font-semibold text-text-primary">{item.category || 'N/A'}</span>
               </div>
            </div>
            <div className="bg-surface rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-text-primary mb-2">Description</h2>
              <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                {item.description || 'No description provided.'}
              </p>
            </div>
            <div className="mt-4 bg-surface rounded-xl shadow-md p-6">
              <BuyNowForm
                itemId={item.id}
                sellerId={item.seller_id}
                finalAmount={item.buy_now_price || 0}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}