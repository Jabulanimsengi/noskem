// File: app/account/orders/page.tsx

import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Define the final shape of the data we will assemble in our code
type OrderWithDetails = {
    id: number;
    final_amount: number;
    status: string;
    seller_id: string;
    buyer_id: string;
    item: {
        id: number;
        title: string;
        images: string[] | null;
    } | null;
    seller: {
        username: string | null;
    } | null;
    buyer: {
        username: string | null;
    } | null;
};

// Helper to format the status text
const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toUpperCase();
};

export default async function MyOrdersPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth');
    }

    // --- NEW, ROBUST DATA FETCHING LOGIC ---

    // 1. First, fetch the user's core orders (simple and reliable).
    const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`id, final_amount, status, item_id, seller_id, buyer_id`)
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    if (ordersError) {
        console.error("--- Database Error (Orders) ---", ordersError.message);
        return <p className="text-red-500 text-center p-8">Error fetching your orders.</p>;
    }

    // 2. Now, for each order, fetch its related details individually.
    const ordersWithDetails: OrderWithDetails[] = await Promise.all(
        (ordersData || []).map(async (order) => {
            // Fetch the item's details
            const { data: item } = await supabase
                .from('items')
                .select('id, title, images')
                .eq('id', order.item_id)
                .single();

            // Fetch the seller's profile
            const { data: seller } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', order.seller_id)
                .single();

            // Fetch the buyer's profile
            const { data: buyer } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', order.buyer_id)
                .single();

            // 3. Combine everything into one clean object.
            return {
                ...order,
                item: item,
                seller: seller,
                buyer: buyer,
            };
        })
    );
    
    // Now that we have the full data, we can filter it correctly.
    const buyingOrders = ordersWithDetails.filter(o => o.buyer_id === user.id);
    const sellingOrders = ordersWithDetails.filter(o => o.seller_id === user.id);

    // Reusable component for displaying an order row, now with guaranteed data
    const OrderRow = ({ order, perspective }: { order: OrderWithDetails; perspective: 'buying' | 'selling' }) => {
        const item = order.item;
        const otherUser = perspective === 'buying' ? order.seller : order.buyer;
        const imageUrl = (item && Array.isArray(item.images) && item.images.length > 0) ? item.images[0] : 'https://placehold.co/150x150';

        return (
             <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-gray-700 rounded-md gap-4">
                <div className="flex items-center gap-4 w-full">
                    <Image src={imageUrl} alt={item?.title || ''} width={64} height={64} className="rounded-md object-cover flex-shrink-0" unoptimized />
                    <div className="flex-grow">
                        <p className="font-semibold text-white truncate">{item?.title || 'Item Not Found'}</p>
                        <p className="text-sm text-gray-400">
                            {perspective === 'buying' ? 'Bought from: ' : 'Sold to: '}
                            {otherUser?.username || 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                    <div className="text-left sm:text-right">
                        <p className="font-bold text-lg text-indigo-400">R{order.final_amount.toFixed(2)}</p>
                        <p className="text-xs font-semibold px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full mt-1 inline-block">{formatStatus(order.status)}</p>
                    </div>
                    <Link href={`/chat/${order.id}`} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap">
                        Contact
                    </Link>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <h1 className="text-3xl font-bold text-white mb-6">My Orders</h1>
            <div className="space-y-8">
                {/* SELLING SECTION */}
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">Items I'm Selling</h2>
                    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                        {sellingOrders.length > 0 ? (
                            sellingOrders.map((order) => <OrderRow key={order.id} order={order} perspective="selling" />)
                        ) : (
                            <p className="text-gray-400 text-center py-4">You haven't sold any items yet.</p>
                        )}
                    </div>
                </div>
                {/* BUYING SECTION */}
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">Items I'm Buying</h2>
                     <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                        {buyingOrders.length > 0 ? (
                            buyingOrders.map((order) => <OrderRow key={order.id} order={order} perspective="buying" />)
                        ) : (
                             <p className="text-gray-400 text-center py-4">You haven't bought any items yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}