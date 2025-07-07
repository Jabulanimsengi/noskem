// src/app/items/[id]/SellerSidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';
import Link from 'next/link';
import Avatar from '@/app/components/Avatar';
import { Button } from '@/app/components/Button';
import OfferModal from '@/app/components/OfferModal';
import OpenChatButton from '@/app/components/OpenChatButton';
import { useToast } from '@/context/ToastContext';
import { redirect } from 'next/navigation';
import { createCheckoutSession, type FormState } from './actions';

const initialState: FormState = {};

// This interface defines the shape of the props for our component
interface SellerSidebarProps {
  item: ItemWithProfile;
  user: User | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Processing...' : 'Buy Now'}
    </Button>
  );
}

export default function SellerSidebar({ item, user }: SellerSidebarProps) {
  const { openModal } = useAuthModal();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const { showToast } = useToast();
  
  const [state, formAction] = useFormState(createCheckoutSession, initialState);

  const handleUnauthenticatedAction = () => {
    if (!user) {
      openModal('sign_in');
    }
  };
  
  useEffect(() => {
    if (state.success && state.url) {
      redirect(state.url);
    }
    if (state.error) {
      showToast(state.error, 'error');
    }
  }, [state, showToast]);

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
            <form action={user ? formAction : handleUnauthenticatedAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden"name="itemPrice" value={item.buy_now_price || 0} />
              <input type="hidden" name="addDelivery" value="false" /> 
              <SubmitButton />
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