'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import OfferModal from './OfferModal';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';

interface ItemCardProps {
    item: ItemWithProfile;
    user: User | null;
}

export default function ItemCard({ item, user }: ItemCardProps) {
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const { openModal } = useAuthModal();

  const handleAction = (callback: () => void) => {
    if (!user) {
      // FIX: Use the correct 'sign_in' view type
      openModal('sign_in');
    } else {
      callback();
    }
  };

  const finalImageUrl = (Array.isArray(item.images) && typeof item.images[0] === 'string' && item.images.length > 0)
    ? item.images[0]
    : 'https://placehold.co/600x400/27272a/9ca3af?text=No+Image';

  const sellerUsername = item.profiles?.username || 'user';
  const sellerAvatarUrl = item.profiles?.avatar_url || `https://placehold.co/32x32/0891B2/ffffff.png?text=${sellerUsername.charAt(0) || 'S'}`;

  return (
    <>
      <div className="bg-surface rounded-xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          <div className="relative w-full h-48">
            <Link href={`/items/${item.id}`} className="block h-full">
                <Image 
                  src={finalImageUrl} 
                  alt={item.title} 
                  fill={true} 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: "cover" }} 
                  className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                />
            </Link>
          </div>
          <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-lg font-bold text-text-primary truncate">{item.title}</h3>
              
              {item.profiles && (
                  <Link href={`/sellers/${sellerUsername}`} className="flex items-center gap-2 mt-2 group/seller">
                      <Image 
                        src={sellerAvatarUrl} 
                        alt={sellerUsername} 
                        width={24} 
                        height={24} 
                        className="rounded-full" 
                      />
                      <span className="text-sm text-text-secondary group-hover/seller:text-brand group-hover/seller:underline">{sellerUsername}</span>
                  </Link>
              )}

              <p className="mt-3 text-2xl font-extrabold text-brand flex-grow">
                  {item.buy_now_price ? `R${item.buy_now_price.toFixed(2)}` : 'Make an Offer'}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => handleAction(() => setIsOfferModalOpen(true))} 
                        className="px-4 py-2 text-sm font-semibold text-brand border-2 border-brand rounded-lg hover:bg-brand/10 transition-colors"
                      >
                          Make Offer
                      </button>
                      
                      {item.buy_now_price && (
                          <Link href={`/items/${item.id}`} onClick={(e) => {
                            if (!user) {
                                e.preventDefault();
                                // FIX: Use the correct 'sign_in' view type
                                openModal('sign_in');
                            }
                          }} className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark text-center">
                              Buy Now
                          </Link>
                      )}
                  </div>
              </div>
          </div>
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