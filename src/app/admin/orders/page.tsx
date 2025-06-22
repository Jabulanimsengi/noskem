import { createClient } from '@/app/utils/supabase/server';
import { type OrderWithDetails } from '@/types';
import Link from 'next/link';

// Helper function to get the correct color for each status
const getStatusClass = (status: string): string => {
    switch (status) {
        case 'pending_payment':
            return 'bg-yellow-100 text-yellow-800';
        case 'payment_authorized':
            return 'bg-blue-100 text-blue-800';
        case 'completed':
            return 'bg-green-100 text-green-800';
        case 'funds_paid_out':
            return 'bg-purple-100 text-purple-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default async function AdminAllOrdersPage() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      item:items (title),
      buyer:buyer_id (username),
      seller:seller_id (username)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="text-red-500">Error fetching orders: {error.message}</p>;
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">All Orders & Payments</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 font-semibold">Order ID</th>
              <th className="p-3 font-semibold">Item</th>
              <th className="p-3 font-semibold">Buyer</th>
              <th className="p-3 font-semibold">Seller</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {(orders as OrderWithDetails[]).map(order => (
              <tr key={order.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">
                    <Link href={`/orders/${order.id}`} className="hover:underline text-brand">
                        #{order.id}
                    </Link>
                </td>
                <td className="p-3 font-medium">{order.item?.title || 'Item not found'}</td>
                <td className="p-3 text-text-secondary">{order.buyer?.username || 'N/A'}</td>
                <td className="p-3 text-text-secondary">{order.seller?.username || 'N/A'}</td>
                <td className="p-3 font-semibold">R{order.final_amount.toFixed(2)}</td>
                <td className="p-3">
                  {/* FIX: The className is now determined by the helper function, which resolves the TypeScript error. */}
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusClass(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </td>
                <td className="p-3 text-text-secondary">{new Date(order.created_at || '').toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}