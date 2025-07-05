// src/app/items/[id]/PurchaseActionsClient.tsx
'use client';

import { useAuthModal } from '@/context/AuthModalContext';
import { type ItemWithProfile } from '@/types';
import { useUser } from '@/hooks/useUser';
import BuyNowForm from './BuyNowForm';
import OfferModal from '@/app/components/OfferModal';
import { useState } from 'react';
import { Button } from '@/app/components/Button';
import { createCheckoutSession } from './actions';

interface PurchaseActionsClientProps {
  item: ItemWithProfile;
}

export default function PurchaseActionsClient({ item }: PurchaseActionsClientProps) {
  const { user } = useUser();
  const { openModal } = useAuthModal();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [addDelivery, setAddDelivery] = useState(false); // State for delivery fee
  const deliveryFee = 399; // The fee amount

  const handleMakeOfferClick = () => {
    if (!user) {
      openModal('sign_in');
    } else {
      setIsOfferModalOpen(true);
    }
  };

  const isSeller = user && user.id === item.seller_id;

  if (item.status !== 'available') {
    return (
      <div className="bg-red-100 border border-red-200 text-red-700 p-4 rounded-lg text-center">
        This item is currently {item.status.replace(/_/g, ' ')}.
      </div>
    );
  }

  if (isSeller) {
    return (
      <div className="p-6 bg-blue-50 rounded-lg shadow-md text-center text-blue-800">
        <p className="font-semibold">This is your listing.</p>
        <p className="text-sm mt-1">You cannot buy or make an offer on your own item.</p>
      </div>
    );
  }

  return (
    <div>
      {/* --- Add this section for the delivery option --- */}
      <div className="mb-4">
        <label htmlFor="delivery" className="flex items-center gap-3 p-4 border rounded-lg hover:border-brand cursor-pointer transition-colors bg-white">
            <input 
                type="checkbox"
                id="delivery"
                name="delivery"
                checked={addDelivery}
                onChange={(e) => setAddDelivery(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <div>
                <p className="font-semibold text-gray-800">Collection & Delivery</p>
                <p className="text-sm text-gray-500">An agent collects, inspects, and delivers the item to you.</p>
            </div>
            <p className="ml-auto font-bold text-brand">R {deliveryFee}</p>
        </label>
      </div>
      {/* --- End of section --- */}

      <div className="space-y-4">
        {item.buy_now_price && item.buy_now_price > 0 && (
          <BuyNowForm
            itemId={item.id}
            sellerId={item.seller_id}
            itemPrice={item.buy_now_price}
            itemTitle={item.title}
            action={createCheckoutSession}
            addDelivery={addDelivery} // Pass the delivery state to the form
          />
        )}

        <Button
          onClick={handleMakeOfferClick}
          variant="secondary"
          className="w-full text-brand border-brand hover:bg-brand-light"
        >
          Make an Offer
        </Button>
      </div>

      {isOfferModalOpen && user && (
        <OfferModal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          itemId={item.id}
          itemTitle={item.title}
          sellerId={item.seller_id}
        />
      )}
    </div>
  );
}