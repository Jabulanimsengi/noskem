import { createClient } from '../../utils/supabase/server';
import { notFound } from 'next/navigation';
import ImageGallery from '../../components/ImageGallery';
import BuyNowForm from './BuyNowForm';

interface ItemDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  // Access params before any await calls to fix the error
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
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column: Image Gallery */}
        <div>
          <ImageGallery images={item.images} itemTitle={item.title} />
        </div>

        {/* Right Column: Item Details */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{item.title}</h1>
          
          <div className="text-sm text-gray-400">
            Sold by{' '}
            <span className="font-semibold text-indigo-400">
              {/* @ts-ignore */}
              {item.profiles?.username || 'Anonymous'}
            </span>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-3xl font-bold text-indigo-400">
              {item.buy_now_price ? `R${item.buy_now_price.toFixed(2)}` : 'Bidding Only'}
            </p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg space-y-2">
             <div className="flex justify-between">
                <span className="text-gray-400">Condition</span>
                <span className="font-semibold text-white">{formatCondition(item.condition)}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-400">Category</span>
                <span className="font-semibold text-white">{item.category || 'N/A'}</span>
             </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Description</h2>
            <p className="text-gray-300 whitespace-pre-wrap">
              {item.description || 'No description provided.'}
            </p>
          </div>

          <div className="mt-4">
            <BuyNowForm
              itemId={item.id}
              sellerId={item.seller_id}
              finalAmount={item.buy_now_price || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
