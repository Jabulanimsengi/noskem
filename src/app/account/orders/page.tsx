// File: app/account/orders/page.tsx

import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// --- THIS IS THE CORRECTED TYPE DEFINITION ---
type Order = {
    id: number;
    final_amount: number;
    status: string;
    seller_id: string;
    buyer_id: string;
    items: {
        id: number;
        title: string;
        images: string[] | null;
    }[] | null; 
    // seller and buyer are returned as arrays of profile objects
    seller: { username: string | null; }[] | null;
    buyer: { username: string | null; }[] | null;
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

    const { data, error } = await supabase
        .from('orders')
        .select(`
            id,
            final_amount,
            status,
            seller_id,
            buyer_id,
            items ( id, title, images ),
            seller:profiles!orders_seller_id_fkey ( username ),
            buyer:profiles!orders_buyer_id_fkey ( username )
        `)
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    const orders: Order[] = data || [];

    if (error) {
        console.error("Error fetching orders:", error);
    }
    
    const buyingOrders = orders.filter((o: Order) => o.buyer_id === user.id);
    const sellingOrders = orders.filter((o: Order) => o.seller_id === user.id);

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <h1 className="text-3xl font-bold text-white mb-6">My Orders</h1>
            <div className="space-y-8">
                {/* --- SELLING SECTION --- */}
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">Items I'm Selling</h2>
                    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                        {sellingOrders.length > 0 ? (
                            sellingOrders.map((order: Order) => {
                                const item = (Array.isArray(order.items) && order.items.length > 0) ? order.items[0] : null;
                                // Safely access the first element of the buyer array
                                const buyer = (Array.isArray(order.buyer) && order.buyer.length > 0) ? order.buyer[0] : null;
                                const imageUrl = (item && Array.isArray(item.images) && item.images.length > 0) ? item.images[0] : 'https://placehold.co/150x150';
                                
                                return (
                                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                                        <div className="flex items-center gap-4">
                                            <Image src={imageUrl} alt={item?.title || ''} width={64} height={64} className="rounded-md object-cover" unoptimized />
                                            <div>
                                                <p className="font-semibold text-white">{item?.title}</p>
                                                <p className="text-sm text-gray-400">Sold to: {buyer?.username || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-indigo-400">R{order.final_amount.toFixed(2)}</p>
                                            <p className="text-xs font-semibold px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full mt-1">{formatStatus(order.status)}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-400 text-center py-4">You haven't sold any items yet.</p>
                        )}
                    </div>
                </div>

                {/* --- BUYING SECTION --- */}
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">Items I'm Buying</h2>
                     <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                        {buyingOrders.length > 0 ? (
                            buyingOrders.map((order: Order) => {
                                const item = (Array.isArray(order.items) && order.items.length > 0) ? order.items[0] : null;
                                // Safely access the first element of the seller array
                                const seller = (Array.isArray(order.seller) && order.seller.length > 0) ? order.seller[0] : null;
                                const imageUrl = (item && Array.isArray(item.images) && item.images.length > 0) ? item.images[0] : 'https://placehold.co/150x150';

                                return (
                                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                                        <div className="flex items-center gap-4">
                                            <Image src={imageUrl} alt={item?.title || ''} width={64} height={64} className="rounded-md object-cover" unoptimized />
                                            <div>
                                                <p className="font-semibold text-white">{item?.title}</p>
                                                <p className="text-sm text-gray-400">Bought from: {seller?.username || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                             <p className="font-bold text-lg text-indigo-400">R{order.final_amount.toFixed(2)}</p>
                                             <p className="text-xs font-semibold px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full mt-1">{formatStatus(order.status)}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                             <p className="text-gray-400 text-center py-4">You haven't bought any items yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}