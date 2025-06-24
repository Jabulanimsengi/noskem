import { createClient } from '../../utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import PaystackButton from './PaystackButton'; 
import { type Order, type Item } from '@/types';

interface OrderPageProps {
  params: {
    id: string;
  };
}

type OrderWithItem = Order & {
  items: Item | null;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const supabase = await createClient();
  const orderId = params.id;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/?authModal=true');
  }

  const { data: orderData, error } = await supabase
    .from('orders')
    .select(`*, items (*)`)
    .eq('id', orderId)
    .single();

  if (error || !orderData) {
    notFound();
  }

  const order = orderData as OrderWithItem;
  
  if (order.buyer_id !== user.id) {
      return (
        <div className="text-center p-8">
            <h1 className="text-xl font-bold text-red-500">Access Denied</h1>
            <p className="text-text-secondary">You are not authorized to view this order.</p>
        </div>
      );
  }
  
  const item = order.items;

  // FIX: Add a `typeof item.images[0] === 'string'` check to ensure the src is valid.
  const imageUrl = (item && Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string')
    ? item.images[0]
    : 'https://placehold.co/600x400/27272a/9ca3af?text=No+Image';

  return (
    <div className="container mx-auto max-w-lg p-4 sm:p-6">
      <div className="bg-surface rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Order Summary</h1>
          <p className="text-text-secondary">Review your order before proceeding to payment.</p>
        </div>

        <div className="bg-background rounded-lg p-4 flex items-center gap-4 mb-6">
          <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
            <Image
              src={imageUrl}
              alt={item?.title || 'Item Image'}
              fill={true}
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{item?.title || 'Item not found'}</h2>
            <p className="text-2xl font-bold text-brand mt-1">
              R{order.final_amount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm mb-8">
            <div className="flex justify-between">
                <span className="text-text-secondary">Order ID:</span>
                <span className="font-mono text-text-primary">{order.id}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-text-secondary">Status:</span>
                <span className="font-semibold px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    {order.status.replace(/_/g, ' ').toUpperCase()}
                </span>
            </div>
            <div className="flex justify-between">
                <span className="text-text-secondary">Order Date:</span>
                <span className="text-text-primary">{new Date(order.created_at || '').toLocaleDateString()}</span>
            </div>
        </div>
        
        {order.status === 'pending_payment' && order.final_amount > 0 ? (
          <PaystackButton 
            orderId={order.id}
            userEmail={user.email || ''}
            amount={order.final_amount}
          />
        ) : (
          <div className="p-4 text-center bg-green-100 text-green-700 rounded-lg">
            This order has been processed.
          </div>
        )}
      </div>
    </div>
  );
}