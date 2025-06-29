'use client';

import { useState, useEffect } from 'react';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import { type ItemData } from './page';
import Link from 'next/link';
import Avatar from '@/app/components/Avatar';
import { Button } from '@/app/components/Button';
import OfferModal from '@/app/components/OfferModal';
import OpenChatButton from '@/app/components/OpenChatButton';
import { useFormState } from 'react-dom';
import { createCheckoutSession, type FormState } from './actions';
import { useToast } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';

const initialState: FormState = {
  error: null,
  sessionId: null,
};

export default function SellerSidebar({ item, user }: { item: ItemData, user: User | null }) {
  const { openModal } = useAuthModal();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const { showToast } = useToast();
  const { setIsLoading } = useLoading();

  const [buyNowState, buyNowAction] = useFormState(createCheckoutSession, initialState);

  useEffect(() => {
    if (buyNowState.error) {
      showToast(buyNowState.error, 'error');
      setIsLoading(false);
    }
  }, [buyNowState, showToast, setIsLoading]);

  const handleUnauthenticatedAction = () => {
    openModal('sign_in'); // This call is now correct
  };

  const handleBuyNowSubmit = (formData: FormData) => {
    setIsLoading(true);
    buyNowAction(formData);
  };
  
  const seller = item.profiles;

  if (!seller) {
    return null;
  }

  const isOwnListing = user?.id === item.seller_id;

  return (
    <>
      <div className="p-6 bg-white rounded-xl shadow-md border space-y-6">
        <h3 className="text-lg font-bold text-gray-800">Seller Information</h3>
        <Link href={`/sellers/${seller.username}`} className="flex items-center gap-4 group">
          <Avatar 
            src={seller.avatar_url} 
            alt={seller.username || 'Seller Avatar'} // Fallback added
            size={48} 
          />
          <div>
            <p className="font-bold text-gray-900 group-hover:underline">{seller.username}</p>
            <p className="text-sm text-gray-500">View Profile</p>
          </div>
        </Link>
        {!isOwnListing && (
          <div className="space-y-3 pt-4 border-t">
            <form action={user ? handleBuyNowSubmit : handleUnauthenticatedAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="sellerId" value={item.seller_id} />
              <input type="hidden" name="itemPrice" value={item.buy_now_price || 0} />
              <Button type="submit" size="lg" className="w-full">
                Buy Now
              </Button>
            </form>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={user ? () => setIsOfferModalOpen(true) : handleUnauthenticatedAction}
            >
              Make an Offer
            </Button>
            <OpenChatButton 
              recipientId={seller.id}
              recipientUsername={seller.username || 'Seller'} // Fallback added
              recipientAvatar={seller.avatar_url}
              itemTitle={item.title || 'this item'}
            />
          </div>
        )}
      </div>

      {user && isOfferModalOpen && (
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