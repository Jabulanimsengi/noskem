/**
 * CODE REASSESSMENT UPDATE
 * -----------------------------------------
 * As part of the full-app review, the data flow has been standardized.
 * The `ItemWithProfile` type now expects `profiles` to be a single object, not an array.
 *
 * The complex data transformation previously done in this file is no longer needed,
 * as the data fetched from the database now directly matches the shape required by the
 * <ItemCard /> component.
 */
import { createClient } from '../../utils/supabase/server';
import { notFound } from 'next/navigation';
import ItemCard from '@/app/components/ItemCard';
import Avatar from '@/app/components/Avatar';
import { FaStar } from 'react-icons/fa';
import { type ItemWithProfile } from '@/types';

interface SellerPageProps {
  params: {
    username: string;
  };
}

const StarDisplay = ({ rating }: { rating: number }) => {
    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
                <FaStar key={i} color={i < Math.round(rating) ? '#ffc107' : '#e4e5e9'} />
            ))}
        </div>
    );
};

export default async function SellerPage({ params }: SellerPageProps) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('id, username, created_at, avatar_url, average_rating')
    .eq('username', params.username)
    .single();

  if (!sellerProfile) {
    notFound();
  }

  // Fetch the items. The `profiles` field will be an object.
  const { data: itemsFromDb } = await supabase
    .from('items')
    .select('*, profiles!inner(username, avatar_url)')
    .eq('seller_id', sellerProfile.id)
    .eq('status', 'available');
    
  // The data now matches our standardized types, no transformation needed.
  const typedItems: ItemWithProfile[] = itemsFromDb || [];

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, reviewer:reviewer_id(username, avatar_url)')
    .eq('seller_id', sellerProfile.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="bg-surface rounded-xl shadow-lg p-8 mb-8 flex flex-col sm:flex-row items-center gap-6">
        <Avatar src={sellerProfile.avatar_url} alt={sellerProfile.username || 'Seller'} size={96} />
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{sellerProfile.username}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StarDisplay rating={sellerProfile.average_rating || 0} />
            <span className="text-text-secondary font-semibold">
                {(sellerProfile.average_rating || 0).toFixed(1)} ({reviews?.length || 0} reviews)
            </span>
          </div>
          <p className="text-text-secondary mt-1">
            Joined on {new Date(sellerProfile.created_at).toLocaleDateString('en-ZA')}
          </p>
        </div>
      </div>
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Items for Sale</h2>
        {typedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {typedItems.map((item) => (
                    <ItemCard key={item.id} item={item} user={currentUser} />
                ))}
            </div>
        ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
                <p className="text-text-secondary">{sellerProfile.username} has no items for sale right now.</p>
            </div>
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-6">Seller Reviews</h2>
        <div className="space-y-6">
            {reviews && reviews.length > 0 ? (
                reviews.map(review => (
                    <div key={review.id} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {/* FIX: Access the first element of the reviewer array */}
                                <Avatar src={review.reviewer?.[0]?.avatar_url} alt={review.reviewer?.[0]?.username || 'U'} size={24} />
                                <span className="font-bold text-text-primary">{review.reviewer?.[0]?.username || 'Anonymous'}</span>
                            </div>
                            <StarDisplay rating={review.rating} />
                        </div>
                        <p className="text-text-secondary">{review.comment}</p>
                    </div>
                ))
            ) : (
                 <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <p className="text-text-secondary">This seller has no reviews yet.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}