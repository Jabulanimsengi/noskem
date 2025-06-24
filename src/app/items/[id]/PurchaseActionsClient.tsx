'use client';

import { useState } from 'react';
import { type User } from '@supabase/supabase-js';
// FIX: Use a type-only import for better practice.
import { type ItemDataWithCategory } from './page';
import { useAuthModal } from '@/context/AuthModalContext';
import OfferModal from '@/app/components/OfferModal';
import BuyNowForm from './BuyNowForm';

interface PurchaseActionsClientProps {
  item: ItemDataWithCategory;
  user: User | null;
}

export default function PurchaseActionsClient({ item, user }: PurchaseActionsClientProps) {
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const { openModal } = useAuthModal();

  const handleOfferClick = () => {
    if (!user) {
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
          {item.buy_now_price && item.buy_now_price > 0 && (
            <BuyNowForm
              itemId={item.id}
              sellerId={item.seller_id}
              finalAmount={item.buy_now_price}
            />
          )}
          <button
            onClick={handleOfferClick}
            className="w-full px-4 py-3 font-semibold text-brand border-2 border-brand rounded-lg hover:bg-brand/10 transition-colors"
          >
            Make Offer
          </button>
        </div>
      </div>

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