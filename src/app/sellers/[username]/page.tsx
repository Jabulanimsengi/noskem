import { createClient } from '../../utils/supabase/server';
import { notFound } from 'next/navigation';
import ItemCard from '@/app/components/ItemCard';
import Avatar from '@/app/components/Avatar';
import { FaStar } from 'react-icons/fa';
import { type ItemWithProfile, type UserBadge } from '@/types';
import BackButton from '@/app/components/BackButton';
import UserBadges from '@/app/components/UserBadges';

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
    .select('id, username, created_at, avatar_url, average_rating, availability_notes')
    .eq('username', params.username)
    .single();

  if (!sellerProfile) {
    notFound();
  }

  const [availableItemsRes, soldItemsRes, reviewsRes, badgesRes] = await Promise.all([
    supabase
      .from('items')
      .select('*, profiles:seller_id(username, avatar_url)')
      .eq('seller_id', sellerProfile.id)
      .eq('status', 'available'),
    supabase
      .from('items')
      .select('*, profiles:seller_id(username, avatar_url)')
      .eq('seller_id', sellerProfile.id)
      .eq('status', 'sold')
      .order('updated_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer:reviewer_id(username, avatar_url)')
      .eq('seller_id', sellerProfile.id)
      .order('created_at', { ascending: false }),
    supabase
        .from('user_badges')
        .select('badge_type')
        .eq('user_id', sellerProfile.id)
  ]);
    
  const availableItems: ItemWithProfile[] = (availableItemsRes.data || []) as ItemWithProfile[];
  const soldItems: ItemWithProfile[] = (soldItemsRes.data || []) as ItemWithProfile[];
  const reviews = reviewsRes.data || [];
  
  // --- START OF FIX ---
  // We will safely filter the data and use a type guard to ensure every item
  // in the final array has the correct shape. This is more robust than casting.
  const badges: UserBadge[] = (badgesRes.data || []).filter(
    (badge): badge is UserBadge => 
        badge && typeof badge === 'object' && 'badge_type' in badge
  );
  // --- END OF FIX ---

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
          <BackButton />
      </div>

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
            Joined on {new Date(sellerProfile.created_at || '').toLocaleDateString('en-ZA')}
          </p>
          {sellerProfile.availability_notes && (
            <p className="text-sm italic text-text-secondary mt-2 bg-gray-50 p-2 rounded-md">{sellerProfile.availability_notes}</p>
          )}
          <UserBadges badges={badges} />
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Items for Sale</h2>
        {availableItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {availableItems.map((item) => (
                    <ItemCard key={item.id} item={item} user={currentUser} />
                ))}
            </div>
        ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
                <p className="text-text-secondary">{sellerProfile.username} has no items for sale right now.</p>
            </div>
        )}
      </div>

      {soldItems.length > 0 && (
        <div className="mb-12 border-t pt-12">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Recently Sold</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {soldItems.map((item) => (
                    <ItemCard key={item.id} item={item} user={currentUser} />
                ))}
            </div>
        </div>
      )}
      
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-6">Seller Reviews</h2>
        <div className="space-y-6">
            {reviews && reviews.length > 0 ? (
                reviews.map(review => (
                    <div key={review.id} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
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