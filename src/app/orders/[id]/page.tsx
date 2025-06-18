import { createClient } from '../../utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import PaystackButton from './PaystackButton'; // Import the new component

interface OrderPageProps {
  params: {
    id: string;
  };
}

type OrderWithItem = {
  id: number;
  status: string;
  final_amount: number;
  created_at: string;
  items: {
    id: number;
    title: string;
    images: string[] | null;
  } | null;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const orderId = params.id;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/auth');
  }

  const { data: orderData, error } = await supabase
    .from('orders')
    .select(`id, status, final_amount, created_at, items (id, title, images)`)
    .eq('id', orderId)
    .single();

  if (error || !orderData) {
    notFound();
  }

  const order = orderData as unknown as OrderWithItem;
  
  const item = order.items;
  const imageUrl = (item && Array.isArray(item.images) && item.images.length > 0)
    ? item.images[0]
    : 'https://placehold.co/600x400/27272a/9ca3af?text=No+Image';

  return (
    <div className="container mx-auto max-w-lg p-4 sm:p-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white">Order Summary</h1>
          <p className="text-gray-400">Review your order before proceeding to payment.</p>
        </div>

        <div className="bg-gray-700 rounded-lg p-4 flex items-center gap-4 mb-6">
          <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
            <Image
              src={imageUrl}
              alt={item?.title || 'Item Image'}
              fill={true}
              style={{ objectFit: 'cover' }}
              unoptimized
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{item?.title || 'Item not found'}</h2>
            <p className="text-2xl font-bold text-indigo-400 mt-1">
              R{order.final_amount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm mb-8">
            <div className="flex justify-between">
                <span className="text-gray-400">Order ID:</span>
                <span className="font-mono text-white">{order.id}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="font-semibold px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">
                    {order.status.replace('_', ' ').toUpperCase()}
                </span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">Order Date:</span>
                <span className="text-white">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
        </div>

        {/* --- USE THE NEW PAYSTACK BUTTON --- */}
        {order.status === 'pending_payment' ? (
          <PaystackButton 
            orderId={order.id}
            userEmail={user.email || ''}
            amount={order.final_amount}
          />
        ) : (
          <div className="p-4 text-center bg-green-900/50 text-green-300 rounded-lg">
            Payment has already been authorized for this order.
          </div>
        )}
      </div>
    </div>
  );
}