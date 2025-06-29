'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type OrderWithItemAndProfile, type Perspective } from '@/types';
import { Button } from '@/app/components/Button';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';
import { useToast } from '@/context/ToastContext';
import { requestReturnAction, cancelOrderAction } from './actions';

interface OrderRowProps {
  order: OrderWithItemAndProfile;
  perspective: Perspective;
}

const OrderRow: React.FC<OrderRowProps> = ({ order, perspective }) => {
  const { showConfirmation } = useConfirmationModal();
  const { showToast } = useToast();

  const handleCancel = () => {
    showConfirmation({
      title: 'Cancel Order',
      message: `Are you sure you want to cancel this order? This cannot be undone.`,
      confirmText: 'Yes, Cancel',
      onConfirm: async () => {
        try {
          const result = await cancelOrderAction(order.id);
          if (result.success) {
            showToast('Order cancelled successfully.', 'success');
          } else {
            showToast(result.error || 'Failed to cancel order.', 'error');
          }
        } catch (e) {
          showToast((e as Error).message, 'error');
        }
      },
    });
  };

  const handleDispute = () => {
    showConfirmation({
      title: 'File a Dispute',
      message: "Are you sure you want to file a dispute for this order? This will pause the seller's payment and an admin will review the case.",
      confirmText: 'Yes, File Dispute',
      onConfirm: async () => {
        try {
          await requestReturnAction(order.id);
          showToast('Dispute filed successfully. An admin will be in touch.', 'success');
        } catch (e) {
          showToast((e as Error).message, 'error');
        }
      },
    });
  };

  const isBuying = perspective === 'buying';
  const counterparty = isBuying ? order.seller_profile : order.buyer_profile;
  const imageUrl = Array.isArray(order.item?.images) && order.item.images.length > 0 && typeof order.item.images[0] === 'string'
    ? order.item.images[0]
    : 'https://placehold.co/64x64/27272a/9ca3af?text=No+Image';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg border gap-4">
      <div className="flex items-center gap-4 w-full">
        <Image
          src={imageUrl}
          alt={order.item?.title || 'Item Image'}
          width={64}
          height={64}
          className="rounded-md object-cover flex-shrink-0"
        />
        <div className="flex-grow">
          <p className="font-semibold text-text-primary truncate">{order.item?.title}</p>
          <p className="text-sm text-text-secondary">
            Order #{order.id} with {counterparty?.username || 'user'}
          </p>
          <p className="font-semibold text-sm mt-1">
            R {Number(order.final_amount).toFixed(2)}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
        <div className="text-center sm:text-right flex-shrink-0 sm:pr-4">
          <span className="font-semibold capitalize px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            {order.status?.replace(/_/g, ' ') || 'N/A'}
          </span>
        </div>
        <div className="flex gap-2 items-center flex-shrink-0">
          <Link href={`/orders/${order.id}`}>
            <Button variant="outline" size="sm" className="w-full">View Order</Button>
          </Link>
          {isBuying && ['pending_payment', 'payment_authorized'].includes(order.status) && (
            <Button onClick={handleCancel} variant="destructive" size="sm" className="w-full">Cancel</Button>
          )}
          {isBuying && order.status === 'delivered' && (
             <Button onClick={handleDispute} variant="destructive" size="sm" className="w-full">File Dispute</Button>
          )}
        </div>
      </div>
    </div>
  );
};

interface OrdersClientProps {
  orders: OrderWithItemAndProfile[];
  perspective: Perspective;
}

export default function OrdersClient({ orders, perspective }: OrdersClientProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-800">No orders found</h3>
        <p className="text-gray-500 mt-2">
          {perspective === 'buying' ? "You haven't bought anything yet." : "You haven't sold anything yet."}
        </p>
        {perspective === 'buying' && (
          <Link href="/marketplace" className="mt-4 inline-block">
             <Button>Start Shopping</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} perspective={perspective} />
      ))}
    </div>
  );
}