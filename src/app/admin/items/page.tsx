import { createClient } from '@/app/utils/supabase/server';
import { type ItemWithProfile } from '@/types';
import Link from 'next/link';
// We will create this component in the next step
import FeatureToggle from './FeatureToggle';

export default async function AdminAllItemsPage() {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from('items')
    .select('*, profiles:seller_id(username)')
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="text-red-500">Error fetching items: {error.message}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">All Listed Items</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 font-semibold">Title</th>
              <th className="p-3 font-semibold">Seller</th>
              <th className="p-3 font-semibold">Price</th>
              <th className="p-3 font-semibold">Status</th>
              {/* FIX: Add new columns for Featured status and Actions */}
              <th className="p-3 font-semibold">Featured</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(items as ItemWithProfile[]).map(item => (
              <tr key={item.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="p-3 font-medium">
                  <Link href={`/items/${item.id}`} className="hover:underline text-brand">
                    {item.title}
                  </Link>
                </td>
                <td className="p-3 text-text-secondary">{item.profiles?.username || 'N/A'}</td>
                <td className="p-3 text-text-secondary">R{item.buy_now_price?.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.status ? item.status.replace(/_/g, ' ') : 'N/A'}</td>
                {/* FIX: Display Yes/No for featured status */}
                <td className="p-3 font-semibold">
                  {item.is_featured ? 'Yes' : 'No'}
                </td>
                {/* FIX: Add the toggle button component */}
                <td className="p-3 text-right">
                    <FeatureToggle itemId={item.id} isFeatured={!!item.is_featured} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}