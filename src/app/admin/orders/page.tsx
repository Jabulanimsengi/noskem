import { createClient } from '@/app/utils/supabase/server';
import Link from 'next/link';
import OrderStatusManager from './OrderStatusManager';
// FIX: Ensure the import is from '@/types'
import { type OrderWithDetails } from '@/types';

const getStatusClass = (status: string): string => {
    switch (status) {
        case 'in_warehouse': return 'bg-purple-100 text-purple-800';
        case 'out_for_delivery': return 'bg-cyan-100 text-cyan-800';
        // ... other cases
        default: return 'bg-gray-100 text-gray-800';
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
          {/* ... table head ... */}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.final_amount ? `R${order.final_amount.toFixed(2)}` : 'N/A'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusClass(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </td>
                <td className="p-3 text-text-secondary">{new Date(order.created_at || '').toLocaleDateString()}</td>
                <td className="p-3 text-right">
                    <OrderStatusManager orderId={order.id} currentStatus={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}