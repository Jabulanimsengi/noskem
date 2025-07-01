// src/app/items/[id]/SellerSidebar.tsx
'use client';

import { useState, useTransition } from 'react';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile, type Profile } from '@/types';
import Link from 'next/link';
import Avatar from '@/app/components/Avatar';
import { Button } from '@/app/components/Button'; // FIX: Changed '=' to 'from'
import OfferModal from '@/app/components/OfferModal';
import OpenChatButton from '@/app/components/OpenChatButton';
import { createCheckoutSession } from './actions';
import { useToast } from '@/context/ToastContext';

interface SellerSidebarProps {
  item: ItemWithProfile;
  user: User | null;
}

export default function SellerSidebar({ item, user }: SellerSidebarProps) {
  const { openModal } = useAuthModal();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleUnauthenticatedAction = () => {
    openModal('sign_in');
  };

  const handleBuyNowSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default browser form submission

    startTransition(async () => {
      // If user is not logged in, trigger auth modal. This is a client-side check.
      if (!user) {
        handleUnauthenticatedAction();
        return;
      }
      
      const formData = new FormData(event.currentTarget); // Get FormData from the event target

      const result = await createCheckoutSession(
        { error: undefined }, // Initial state for the action
        formData
      );

      if (result?.error) {
        showToast(result.error, 'error');
      } else if (result?.success && result.url) {
        showToast('Redirecting to payment gateway...', 'success');
        window.location.href = result.url;
      }
    });
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
            alt={seller.username || 'Seller Avatar'}
            size={48}
          />
          <div>
            <p className="font-bold text-gray-900 group-hover:underline">{seller.username}</p>
            <p className="text-sm text-gray-500">View Profile</p>
          </div>
        </Link>
        {!isOwnListing && (
          <div className="space-y-3 pt-4 border-t">
            {/* Form for Buy Now - calls handler which checks authentication */}
            <form onSubmit={handleBuyNowSubmit}>
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="sellerId" value={item.seller_id} />
              <input type="hidden" name="itemPrice" value={item.buy_now_price || 0} />
              <input type="hidden" name="itemTitle" value={item.title || ''} />
              <Button type="submit" size="lg" className="w-full" disabled={isPending}>
                {isPending ? 'Processing...' : 'Buy Now'}
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
            {/* Conditionally render OpenChatButton or a simple Contact button for unauthenticated users */}
            {user ? (
              <OpenChatButton
                recipientId={seller.id}
                recipientUsername={seller.username || 'Seller'}
                recipientAvatar={seller.avatar_url}
                itemTitle={item.title || 'this item'}
              />
            ) : (
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={handleUnauthenticatedAction} // Redirect to auth modal if not logged in
              >
                Contact
              </Button>
            )}
          </div>
        )}
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
    </>
  );
}