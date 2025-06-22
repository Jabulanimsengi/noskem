'use client';

import { useState } from 'react';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';
import { useAuthModal } from '@/context/AuthModalContext';
import OfferModal from '@/app/components/OfferModal';
import BuyNowForm from './BuyNowForm';

interface PurchaseActionsClientProps {
  item: ItemWithProfile;
  user: User | null;
}

export default function PurchaseActionsClient({ item, user }: PurchaseActionsClientProps) {
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const { openModal } = useAuthModal();

  const handleOfferClick = () => {
    if (!user) {
      // If user is not logged in, open the sign-in modal
      openModal('sign_in');
    } else {
      setIsOfferModalOpen(true);
    }
  };

  return (
    <>
      <div className="bg-surface rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Purchase Options</h2>
        <div className="space-y-4">
          {/* We only render the BuyNowForm if there is a price */}
          {item.buy_now_price && item.buy_now_price > 0 && (
            <BuyNowForm
              itemId={item.id}
              sellerId={item.seller_id}
              finalAmount={item.buy_now_price}
            />
          )}
          {/* We always render the Make Offer button */}
          <button
            onClick={handleOfferClick}
            className="w-full px-4 py-3 font-semibold text-brand border-2 border-brand rounded-lg hover:bg-brand/10 transition-colors"
          >
            Make Offer
          </button>
        </div>
      </div>

      {/* The OfferModal is rendered outside the main flow and controlled by state */}
      {user && (
        <OfferModal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          itemId={item.id}
          itemTitle={item.title}
          sellerId={item.seller_id}
        />
      )}
    </>
  );
}