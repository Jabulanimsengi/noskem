// src/app/items/[id]/SellerSidebar.tsx
'use client';

import { useState, useTransition } from 'react';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';
import Link from 'next/link';
import Avatar from '@/app/components/Avatar';
import { Button } from '@/app/components/Button';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleUnauthenticatedAction = () => {
    openModal('sign_in');
  };

  const handleBuyNowSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    startTransition(async () => {
      if (!user) {
        handleUnauthenticatedAction();
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData(event.currentTarget);
      
      // FIX: The function call now correctly passes only one argument.
      const result = await createCheckoutSession(formData);

      if (result?.error) {
        showToast(result.error, 'error');
        setIsSubmitting(false);
      } else if (result?.success && result.url) {
        // On success, redirect the user to the payment page.
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
            <form onSubmit={handleBuyNowSubmit}>
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="sellerId" value={item.seller_id} />
              <input type="hidden" name="itemPrice" value={item.buy_now_price || 0} />
              <input type="hidden" name="itemTitle" value={item.title || ''} />
              <Button type="submit" size="lg" className="w-full" disabled={isPending || isSubmitting}>
                {isPending || isSubmitting ? 'Processing...' : 'Buy Now'}
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
                onClick={handleUnauthenticatedAction}
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