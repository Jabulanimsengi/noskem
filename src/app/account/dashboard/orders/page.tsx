// File: app/account/dashboard/orders/page.tsx

import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { confirmReceipt, claimSellerFunds } from './actions';

// Define the final shape of the data we will assemble
type OrderWithDetails = {
    id: number; final_amount: number; status: string; buyer_id: string; seller_id: string;
    item: { id: number; title: string; images: string[] | null; } | null;
    seller: { username: string | null; } | null;
    buyer: { username: string | null; } | null;
};

const formatStatus = (status: string) => status.replace(/_/g, ' ').toUpperCase();

export default async function MyOrdersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { redirect('/auth'); }

    // Fetch orders
    const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`id, final_amount, status, item_id, seller_id, buyer_id`)
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    if (ordersError) {
        return <p className="text-red-500 text-center p-8">Error fetching your orders.</p>;
    }

    const ordersWithDetails: OrderWithDetails[] = await Promise.all(
        (ordersData || []).map(async (order) => {
            const { data: item } = await supabase.from('items').select('id, title, images').eq('id', order.item_id).single();
            const { data: seller } = await supabase.from('profiles').select('username').eq('id', order.seller_id).single();
            const { data: buyer } = await supabase.from('profiles').select('username').eq('id', order.buyer_id).single();
            return { ...order, item, seller, buyer };
        })
    );
    
    const buyingOrders = ordersWithDetails.filter(o => o.buyer_id === user.id);
    const sellingOrders = ordersWithDetails.filter(o => o.seller_id === user.id);

    const OrderRow = ({ order, perspective }: { order: OrderWithDetails; perspective: 'buying' | 'selling' }) => {
        const item = order.item;
        const otherUser = perspective === 'buying' ? order.seller : order.buyer;
        const imageUrl = (item && Array.isArray(item.images) && item.images.length > 0) ? item.images[0] : 'https://placehold.co/150x150';
        const COMMISSION_RATE = 0.10; 
        const payoutAmount = Math.round(order.final_amount * (1 - COMMISSION_RATE));

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-4">
                <div className="flex items-center gap-4 w-full">
                    <Image src={imageUrl} alt={item?.title || ''} width={64} height={64} className="rounded-md object-cover flex-shrink-0" unoptimized />
                    <div className="flex-grow">
                        <p className="font-semibold text-text-primary truncate">{item?.title || 'Item Not Found'}</p>
                        <p className="text-sm text-text-secondary">{perspective === 'buying' ? 'Bought from: ' : 'Sold to: '} {otherUser?.username || 'N/A'}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-end">
                    <div className="text-left sm:text-right">
                        <p className="font-bold text-lg text-brand">R{order.final_amount.toFixed(2)}</p>
                        <p className="text-xs font-semibold px-2 py-1 bg-yellow-400/20 text-yellow-600 rounded-full mt-1 inline-block">{formatStatus(order.status)}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        {perspective === 'buying' && order.status === 'payment_authorized' && (<form action={confirmReceipt.bind(null, order.id)}><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 whitespace-nowrap">Confirm Receipt</button></form>)}
                        {perspective === 'selling' && order.status === 'completed' && (<form action={claimSellerFunds.bind(null, order.id, payoutAmount)}><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 whitespace-nowrap">Claim Credits</button></form>)}
                        {order.status === 'funds_paid_out' && (<p className="text-sm text-green-500 font-semibold">Paid Out</p>)}
                        <Link href={`/chat/${order.id}`} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap">Contact</Link>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">Items I'm Selling</h2>
                <div className="space-y-4">
                    {sellingOrders.length > 0 ? sellingOrders.map((order) => <OrderRow key={order.id} order={order} perspective="selling" />) : <p className="text-text-secondary text-center py-4">You haven't sold any items yet.</p>}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">Items I'm Buying</h2>
                 <div className="space-y-4">
                    {buyingOrders.length > 0 ? buyingOrders.map((order) => <OrderRow key={order.id} order={order} perspective="buying" />) : <p className="text-text-secondary text-center py-4">You haven't bought any items yet.</p>}
                </div>
            </div>
        </div>
    );
}
