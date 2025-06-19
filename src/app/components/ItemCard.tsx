// File: src/app/components/ItemCard.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import OfferModal from './OfferModal';

export type Item = {
  id: number;
  title: string;
  buy_now_price: number | null;
  images: string[] | string | null;
  seller_id: string;
  profiles: { username: string; avatar_url: string | null; } | null;
};

export default function ItemCard({ item }: { item: Item }) {
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  // Robustly get the image URL
  let finalImageUrl = 'https://placehold.co/600x400/27272a/9ca3af?text=No+Image';
  let imagesArray = item.images;
  if (typeof imagesArray === 'string') {
    try { imagesArray = JSON.parse(imagesArray); } catch (e) { imagesArray = []; }
  }
  if (Array.isArray(imagesArray) && imagesArray.length > 0 && typeof imagesArray[0] === 'string') {
    finalImageUrl = imagesArray[0];
  }

  // --- FIX ---
  // The placeholder URL now requests a .png file to avoid SVG errors.
  const sellerAvatarUrl = item.profiles?.avatar_url || `https://placehold.co/32x32/0891B2/ffffff.png?text=${item.profiles?.username?.charAt(0) || 'S'}`;

  return (
    <>
      <div className="bg-surface rounded-xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          <div className="relative w-full h-48">
              <Link href={`/items/${item.id}`} className="block h-full">
                  <Image
                      src={finalImageUrl}
                      alt={item.title}
                      fill={true}
                      style={{ objectFit: "cover" }}
                      className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                      unoptimized
                  />
              </Link>
          </div>
          <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-lg font-bold text-text-primary truncate">{item.title}</h3>
              
              {/* --- FIX --- 
                  This block is now cleaner to prevent duplication. */}
              {item.profiles && (
                  <div className="flex items-center gap-2 mt-2">
                      <Image 
                          src={sellerAvatarUrl}
                          alt={item.profiles.username || 'seller'} 
                          width={24} 
                          height={24} 
                          className="rounded-full"
                      />
                      <span className="text-sm text-text-secondary">{item.profiles.username}</span>
                  </div>
              )}

              <p className="mt-3 text-2xl font-extrabold text-brand flex-grow">
                  {item.buy_now_price ? `R${item.buy_now_price.toFixed(2)}` : 'Make an Offer'}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-2 w-full">
                      <button 
                        onClick={() => setIsOfferModalOpen(true)} 
                        className="flex-1 px-4 py-2 text-sm font-semibold text-brand border-2 border-brand rounded-lg hover:bg-brand/10 transition-colors"
                      >
                          Make Offer
                      </button>
                      {item.buy_now_price && (
                          <Link href={`/items/${item.id}`} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark text-center">
                              Buy Now
                          </Link>
                      )}
                  </div>
              </div>
          </div>
      </div>

      <OfferModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        itemId={item.id}
        itemTitle={item.title}
        sellerId={item.seller_id}
      />
    </>
  );
}