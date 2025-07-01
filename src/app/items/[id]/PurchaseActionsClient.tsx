// src/app/items/[id]/PurchaseActionsClient.tsx
'use client';

import { useAuthModal } from '@/context/AuthModalContext';
import { type ItemWithProfile, type Profile } from '@/types';
import { useUser } from '@/hooks/useUser';
import BuyNowForm from './BuyNowForm';
import OfferModal from '@/app/components/OfferModal';
import { useState } from 'react';
import { Button } from '@/app/components/Button';
import { createCheckoutSession } from './actions'; // Import the server action

interface PurchaseActionsClientProps {
  item: ItemWithProfile;
}

export default function PurchaseActionsClient({ item }: PurchaseActionsClientProps) {
  const { user, profile } = useUser();
  const { openModal } = useAuthModal();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  const handleBuyNowClick = () => {
    if (!user) {
      openModal('sign_in');
    }
  };

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

  // If the user is the seller, display a message instead of purchase actions
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
      <div className="space-y-4">
        {item.buy_now_price && item.buy_now_price > 0 && (
          <BuyNowForm
            itemId={item.id}
            sellerId={item.seller_id}
            itemPrice={item.buy_now_price}
            // FIX: Pass the missing itemTitle prop
            itemTitle={item.title}
            // FIX: Pass the missing action prop
            action={createCheckoutSession}
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