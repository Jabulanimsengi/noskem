'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import OfferModal from './OfferModal';
import { useAuthModal } from '@/context/AuthModalContext';
import { createClient } from '../utils/supabase/client';
import { type User } from '@supabase/supabase-js';

export type Item = {
  id: number;
  title: string;
  buy_now_price: number | null;
  images: string[] | string | null;
  seller_id: string;
  profiles: { username: string; avatar_url: string | null; } | null;
};

// We add the user prop, which can be null if no one is logged in
interface ItemCardProps {
    item: Item;
    user: User | null;
}

export default function ItemCard({ item, user }: ItemCardProps) {
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const { openModal } = useAuthModal();

  const handleAction = (callback: () => void) => {
    if (!user) {
      openModal('signIn');
    } else {
      callback();
    }
  };

  let finalImageUrl = 'https://placehold.co/600x400/27272a/9ca3af?text=No+Image';
  let imagesArray = item.images;
  if (typeof imagesArray === 'string') {
    try { imagesArray = JSON.parse(imagesArray); } catch (e) { imagesArray = []; }
  }
  if (Array.isArray(imagesArray) && imagesArray.length > 0 && typeof imagesArray[0] === 'string') {
    finalImageUrl = imagesArray[0];
  }

  const sellerAvatarUrl = item.profiles?.avatar_url || `https://placehold.co/32x32/0891B2/ffffff.png?text=${item.profiles?.username?.charAt(0) || 'S'}`;

  return (
    <>
      <div className="bg-surface rounded-xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          <div className="relative w-full h-48">
            <Link href={`/items/${item.id}`} className="block h-full">
                <Image src={finalImageUrl} alt={item.title} fill={true} style={{ objectFit: "cover" }} className="transition-transform duration-300 ease-in-out group-hover:scale-105" unoptimized />
            </Link>
          </div>
          <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-lg font-bold text-text-primary truncate">{item.title}</h3>
              
              {item.profiles && (
                  <div className="flex items-center gap-2 mt-2">
                      <Image src={sellerAvatarUrl} alt={item.profiles.username || 'seller'} width={24} height={24} className="rounded-full" />
                      <span className="text-sm text-text-secondary">{item.profiles.username}</span>
                  </div>
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
                                openModal('signIn');
                            }
                          }} className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark text-center">
                              Buy Now
                          </Link>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {isOfferModalOpen && (
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