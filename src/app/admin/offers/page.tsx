import { createClient } from '@/app/utils/supabase/server';
import { type OfferWithDetails } from '@/types';
import Link from 'next/link';
import { FaExchangeAlt } from 'react-icons/fa';

export default async function AdminAllOffersPage() {
  const supabase = await createClient();

  // This query fetches ALL offers and includes details about the item, buyer, and seller.
  const { data: offers, error } = await supabase
    .from('offers')
    .select(`
      *,
      item:item_id (title),
      buyer:buyer_id (username),
      seller:seller_id (username)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="text-red-500">Error fetching offers: {error.message}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">All Marketplace Offers</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 font-semibold">Item</th>
              <th className="p-3 font-semibold">Participants</th>
              <th className="p-3 font-semibold">Offer Amount</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {(offers as OfferWithDetails[]).map(offer => (
              <tr key={offer.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="p-3 font-medium">
                  <Link href={`/items/${offer.item_id}`} className="hover:underline text-brand">
                    {offer.item?.title || 'Item not found'}
                  </Link>
                </td>
                <td className="p-3 text-text-secondary">
                  <div className="flex items-center gap-2">
                    <span>{offer.buyer?.username || 'N/A'}</span>
                    <FaExchangeAlt className="text-gray-400" />
                    <span>{offer.seller?.username || 'N/A'}</span>
                  </div>
                </td>
                <td className="p-3 font-semibold">R{offer.offer_amount.toFixed(2)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                    offer.status.includes('pending') ? 'bg-yellow-100 text-yellow-800' :
                    offer.status.includes('accepted') ? 'bg-green-100 text-green-800' :
                    offer.status.includes('rejected') ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                  }`}>
                    {offer.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-3 text-text-secondary">{new Date(offer.created_at || '').toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}