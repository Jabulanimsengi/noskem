// src/app/account/dashboard/orders/OrdersClient.tsx

'use client'; 

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { confirmReceipt, claimSellerFunds, requestReturnAction } from './actions';
import OpenChatButton from '@/app/components/OpenChatButton';
import LeaveReviewModal from '@/app/components/LeaveReviewModal'; 
import { type OrderWithDetails } from '@/types';
import { Button } from '@/app/components/Button';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';
import { useToast } from '@/context/ToastContext';

const StatusBadge = ({ status }: { status: string }) => {
    const getStatusClass = () => {
        switch (status) {
            case 'completed':
            case 'delivered':
            case 'funds_paid_out':
                return 'bg-green-100 text-green-800';
            case 'disputed':
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'in_warehouse':
            case 'out_for_delivery':
            case 'awaiting_collection':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${getStatusClass()}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
};

const OrderRow = ({ order, perspective }: { order: OrderWithDetails; perspective: 'buying' | 'selling' }) => {
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const { showConfirmation } = useConfirmationModal();
    const { showToast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleDispute = () => {
        showConfirmation({
            title: "File a Dispute",
            message: "Are you sure you want to file a dispute for this order? This will pause the seller's payment and an admin will review the case.",
            confirmText: "Yes, File Dispute",
            onConfirm: () => {
                startTransition(async () => {
                    try {
                        await requestReturnAction(order.id);
                        showToast('Dispute filed successfully. An admin will be in touch.', 'success');
                    } catch (e) {
                        showToast((e as Error).message, 'error');
                    }
                });
            }
        });
    };

    const item = order.item;
    const otherUser = perspective === 'buying' ? order.seller : order.buyer;
    const imageUrl = (item?.images && Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string') 
        ? item.images[0] 
        : 'https://placehold.co/150x150';
    const hasBeenReviewed = order.reviews && order.reviews.length > 0;

    return (
        <>
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-lg border border-gray-200 gap-4">
                <div className="flex items-center gap-4 w-full">
                    <Image src={imageUrl} alt={item?.title || 'Item Image'} width={64} height={64} className="rounded-md object-cover flex-shrink-0" unoptimized />
                    <div className="flex-grow">
                        <p className="font-semibold text-text-primary truncate">{item?.title || 'Item Not Found'}</p>
                        <p className="text-sm text-text-secondary">{perspective === 'buying' ? 'From: ' : 'To: '} {otherUser?.username || 'N/A'}</p>
                        <p className="font-bold text-lg text-brand mt-1">{order.final_amount ? `R${order.final_amount.toFixed(2)}` : 'N/A'}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-end">
                    <div className="text-left sm:text-right">
                        <StatusBadge status={order.status} />
                    </div>
                    <div className="flex gap-2 items-center">
                        {perspective === 'buying' && order.status === 'delivered' && (
                            <form action={async () => {
                                startTransition(async () => {
                                    try {
                                        await confirmReceipt(order.id);
                                        showToast('Receipt confirmed!', 'success');
                                    } catch(e) { showToast((e as Error).message, 'error') }
                                });
                            }}>
                                <Button type="submit" size="sm" disabled={isPending}>
                                    {isPending ? 'Confirming...' : 'Confirm Receipt'}
                                </Button>
                            </form>
                        )}
                        {perspective === 'buying' && order.status === 'delivered' && (
                             <Button onClick={handleDispute} variant="destructive" size="sm" disabled={isPending}>Dispute</Button>
                        )}
                        {perspective === 'buying' && order.status === 'completed' && !hasBeenReviewed && (
                            <Button onClick={() => setIsReviewModalOpen(true)} size="sm" variant="outline">Leave Review</Button>
                        )}
                        {perspective === 'selling' && order.status === 'completed' && (
                            <form action={async () => {
                                startTransition(async () => {
                                    try {
                                        await claimSellerFunds(order.id);
                                        showToast('Funds have been added to your credits!', 'success');
                                    } catch(e) { showToast((e as Error).message, 'error') }
                                });
                            }}>
                                <Button type="submit" size="sm" disabled={isPending}>
                                    {isPending ? 'Claiming...' : 'Claim Credits'}
                                </Button>
                            </form>
                        )}
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
                    itemTitle={item.title || 'Unknown Item'}
                />
            )}
        </>
    );
};

interface OrdersClientProps {
    initialOrders: OrderWithDetails[];
    perspective: 'buying' | 'selling';
}

export default function OrdersClient({ initialOrders, perspective }: OrdersClientProps) {
    if (initialOrders.length === 0) {
        return (
            <div className="text-center py-16 text-text-secondary bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg text-text-primary">
                    {perspective === 'buying' ? "You haven't purchased any items yet." : "You haven't sold any items yet."}
                </h3>
                <p className="mt-1">
                    {perspective === 'buying' ? "Items you buy will appear here." : "Items you sell will appear here."}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {initialOrders.map((order) => <OrderRow key={order.id} order={order} perspective={perspective} />)}
        </div>
    );
}