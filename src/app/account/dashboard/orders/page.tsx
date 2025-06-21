'use client'; // This must be a client component to manage modal state

import { useState, useEffect } from 'react';
import { createClient } from '../../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { type User } from '@supabase/supabase-js';
import { confirmReceipt, claimSellerFunds } from './actions';
import OpenChatButton from '@/app/components/OpenChatButton';
import LeaveReviewModal from '@/app/components/LeaveReviewModal'; // Import the new modal

type OrderWithDetails = {
    id: number; final_amount: number; status: string; buyer_id: string; seller_id: string;
    item: { id: number; title: string; images: string[] | null; } | null;
    seller: { id: string; username: string | null; avatar_url: string | null; } | null;
    buyer: { id: string; username: string | null; avatar_url: string | null; } | null;
    reviews: { id: number }[]; // Check if a review exists for this order
};
const formatStatus = (status: string) => status.replace(/_/g, ' ').toUpperCase();

// --- The OrderRow component now needs to be a client component for modal logic ---
const OrderRow = ({ order, perspective }: { order: OrderWithDetails; perspective: 'buying' | 'selling' }) => {
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const item = order.item;
    const otherUser = perspective === 'buying' ? order.seller : order.buyer;
    const imageUrl = (item && Array.isArray(item.images) && item.images.length > 0) ? item.images[0] : 'https://placehold.co/150x150';
    const COMMISSION_RATE = 0.10; 
    const payoutAmount = Math.round(order.final_amount * (1 - COMMISSION_RATE));
    const hasBeenReviewed = order.reviews && order.reviews.length > 0;

    return (
        <>
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
                        
                        {/* --- FIX: Show Leave Review button --- */}
                        {perspective === 'buying' && order.status === 'completed' && !hasBeenReviewed && (
                            <button onClick={() => setIsReviewModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap">Leave a Review</button>
                        )}
                        {hasBeenReviewed && <p className="text-sm text-green-500 font-semibold whitespace-nowrap">Reviewed</p>}

                        {perspective === 'selling' && order.status === 'completed' && (<form action={claimSellerFunds.bind(null, order.id, payoutAmount)}><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 whitespace-nowrap">Claim Credits</button></form>)}
                        {order.status === 'funds_paid_out' && (<p className="text-sm text-green-500 font-semibold">Paid Out</p>)}
                        <OpenChatButton 
                            orderId={order.id}
                            recipientId={otherUser?.id || ''}
                            recipientUsername={otherUser?.username || 'User'}
                            recipientAvatar={otherUser?.avatar_url || null}
                            itemTitle={item?.title || 'this item'}
                        />
                    </div>
                </div>
            </div>
            {isReviewModalOpen && item && (
                <LeaveReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    orderId={order.id}
                    sellerId={order.seller_id}
                    itemTitle={item.title}
                />
            )}
        </>
    );
};


export default function MyOrdersPage() {
    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        const getOrders = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                return router.push('/?authModal=true');
            }
            setUser(currentUser);

            // Update the query to get review status
            const { data: ordersData, error } = await supabase
                .from('orders')
                .select(`*, item:items!inner(id, title, images), seller:seller_id(*), buyer:buyer_id(*), reviews(id)`)
                .or(`seller_id.eq.${currentUser.id},buyer_id.eq.${currentUser.id}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error loading orders:", error);
            } else {
                setOrders(ordersData as OrderWithDetails[]);
            }
            setIsLoading(false);
        };
        getOrders();
    }, [router]);

    if (isLoading) {
        return <div className="text-center text-text-secondary py-10">Loading orders...</div>;
    }

    if (!user) {
        return null;
    }

    const buyingOrders = orders.filter(o => o.buyer_id === user.id);
    const sellingOrders = orders.filter(o => o.seller_id === user.id);

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