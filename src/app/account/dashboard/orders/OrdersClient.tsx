'use client'; 

import { useState } from 'react';
import Image from 'next/image';
import { confirmReceipt, claimSellerFunds } from './actions';
import OpenChatButton from '@/app/components/OpenChatButton';
import LeaveReviewModal from '@/app/components/LeaveReviewModal'; 
import { type OrderWithDetails } from '@/types';

const formatStatus = (status: string) => status.replace(/_/g, ' ').toUpperCase();

const OrderRow = ({ order, perspective }: { order: OrderWithDetails; perspective: 'buying' | 'selling' }) => {
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const item = order.item;
    const otherUser = perspective === 'buying' ? order.seller : order.buyer;
    const imageUrl = (item && Array.isArray(item.images) && item.images.length > 0 && item.images[0]) ? item.images[0] : 'https://placehold.co/150x150';
    const hasBeenReviewed = order.reviews && order.reviews.length > 0;

    return (
        <>
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-4">
                <div className="flex items-center gap-4 w-full">
                    <Image src={imageUrl} alt={item?.title || 'Item Image'} width={64} height={64} className="rounded-md object-cover flex-shrink-0" unoptimized />
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
                        {perspective === 'buying' && order.status === 'payment_authorized' && (<form action={() => confirmReceipt(order.id)}><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 whitespace-nowrap">Confirm Receipt</button></form>)}
                        
                        {perspective === 'buying' && order.status === 'completed' && !hasBeenReviewed && (
                            <button onClick={() => setIsReviewModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap">Leave a Review</button>
                        )}
                        {hasBeenReviewed && <p className="text-sm text-green-500 font-semibold whitespace-nowrap">Reviewed</p>}

                        {perspective === 'selling' && order.status === 'completed' && (<form action={() => claimSellerFunds(order.id)}><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 whitespace-nowrap">Claim Credits</button></form>)}
                        
                        {/* FIX: This comparison is now valid because the type was updated. */}
                        {order.status === 'funds_paid_out' && (<p className="text-sm text-green-500 font-semibold">Paid Out</p>)}
                        
                        <OpenChatButton 
                            recipientId={otherUser?.id || ''}
                            recipientUsername={otherUser?.username || 'User'}
                            recipientAvatar={otherUser?.avatar_url || null}
                            itemTitle={`Order #${order.id}: ${item?.title || 'this item'}`}
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
                    // FIX: Provide a fallback to ensure itemTitle is always a string.
                    itemTitle={item.title || 'Unknown Item'}
                />
            )}
        </>
    );
};

interface OrdersClientProps {
    userId: string;
    initialBuyingOrders: OrderWithDetails[];
    initialSellingOrders: OrderWithDetails[];
}

export default function OrdersClient({ initialBuyingOrders, initialSellingOrders }: OrdersClientProps) {
    const [buyingOrders] = useState<OrderWithDetails[]>(initialBuyingOrders);
    const [sellingOrders] = useState<OrderWithDetails[]>(initialSellingOrders);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">Items I&apos;m Selling</h2>
                <div className="space-y-4">
                    {sellingOrders.length > 0 ? sellingOrders.map((order) => <OrderRow key={order.id} order={order} perspective="selling" />) : <p className="text-text-secondary text-center py-4">You haven&apos;t sold any items yet.</p>}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">Items I&apos;m Buying</h2>
                 <div className="space-y-4">
                    {buyingOrders.length > 0 ? buyingOrders.map((order) => <OrderRow key={order.id} order={order} perspective="buying" />) : <p className="text-text-secondary text-center py-4">You haven&apos;t bought any items yet.</p>}
                </div>
            </div>
        </div>
    );
}