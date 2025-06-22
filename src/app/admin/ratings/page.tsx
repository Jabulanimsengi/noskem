import { createClient } from '@/app/utils/supabase/server';
import { FaStar } from 'react-icons/fa';
import Link from 'next/link';

// Define a type for our review data for better type safety
type ReviewWithDetails = {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  order_id: number;
  reviewer: { username: string | null } | null;
  seller: { username: string | null } | null;
};

// A small component to render the star rating
const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
            <FaStar key={i} color={i < Math.round(rating) ? '#ffc107' : '#e4e5e9'} />
        ))}
    </div>
);

export default async function AdminAllRatingsPage() {
  const supabase = await createClient();

  // This query fetches ALL reviews and includes the usernames of the reviewer and the seller.
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:reviewer_id (username),
      seller:seller_id (username)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="text-red-500">Error fetching ratings: {error.message}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">All User Ratings</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 font-semibold">Rating</th>
              <th className="p-3 font-semibold">Comment</th>
              <th className="p-3 font-semibold">Reviewer</th>
              <th className="p-3 font-semibold">Seller</th>
              <th className="p-3 font-semibold">Order ID</th>
              <th className="p-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {(reviews as ReviewWithDetails[]).map(review => (
              <tr key={review.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="p-3">
                  <StarDisplay rating={review.rating} />
                </td>
                <td className="p-3 text-text-secondary italic">"{review.comment || 'No comment'}"</td>
                <td className="p-3 text-text-secondary">{review.reviewer?.username || 'N/A'}</td>
                <td className="p-3 text-text-secondary">{review.seller?.username || 'N/A'}</td>
                <td className="p-3 font-mono text-xs">
                  <Link href={`/orders/${review.order_id}`} className="hover:underline text-brand">
                    #{review.order_id}
                  </Link>
                </td>
                <td className="p-3 text-text-secondary">{new Date(review.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}