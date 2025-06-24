'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import OfferModal from './OfferModal';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';
import { FaCheckCircle, FaEye } from 'react-icons/fa';
import { MessageSquare } from 'lucide-react';
import { useChat, type ChatSession } from '@/context/ChatContext';

const createCanonicalRoomId = (userId1: string, userId2: string): string => {
    const sortedIds = [userId1, userId2].sort();
    return `chat_user_${sortedIds[0]}_${sortedIds[1]}`;
};

interface ItemCardProps {
    item: ItemWithProfile;
    user: User | null;
}

export default function ItemCard({ item, user }: ItemCardProps) {
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const { openModal } = useAuthModal();
  const { openChat } = useChat();

  const handleAction = (callback: () => void) => {
    if (!user) {
      openModal('sign_in');
    } else {
      callback();
    }
  };
  
  const handleStartChat = () => {
    if (!user) {
        openModal('sign_in');
        return;
    }
    if (user.id === item.seller_id) {
        return;
    }

    const roomId = createCanonicalRoomId(user.id, item.seller_id);

    const chatSession: ChatSession = {
      roomId: roomId,
      recipientId: item.seller_id,
      recipientUsername: item.profiles?.username || 'Seller',
      recipientAvatar: item.profiles?.avatar_url || null,
      itemTitle: `About: ${item.title}`,
    };
    openChat(chatSession);
  };

  const finalImageUrl = (Array.isArray(item.images) && typeof item.images[0] === 'string' && item.images.length > 0)
    ? item.images[0]
    : 'https://placehold.co/600x400/27272a/9ca3af?text=No+Image';

  const sellerProfile = item.profiles;
  const sellerUsername = sellerProfile?.username || 'user';
  const sellerAvatarUrl = sellerProfile?.avatar_url || `https://placehold.co/32x32/0891B2/ffffff.png?text=${sellerUsername.charAt(0) || 'S'}`;

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
              
              {sellerProfile && (
                  <div className="flex items-center justify-between mt-2">
                    <Link href={`/sellers/${sellerUsername}`} className="flex items-center gap-2 group/seller">
                        <Image 
                          src={sellerAvatarUrl} 
                          alt={sellerUsername} 
                          width={24} 
                          height={24} 
                          className="rounded-full" 
                        />
                        <span className="text-sm text-text-secondary group-hover/seller:text-brand group-hover/seller:underline">{sellerUsername}</span>
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                        <FaEye />
                        <span>{item.view_count || 0}</span>
                    </div>
                  </div>
              )}

              <p className="mt-3 text-2xl font-extrabold text-brand flex-grow">
                  {item.buy_now_price ? `R${item.buy_now_price.toFixed(2)}` : 'Make an Offer'}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                {item.status === 'available' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={handleStartChat}
                      className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {/* FIX: Use utility classes for sizing instead of a fixed size prop */}
                      <MessageSquare className="h-4 w-4" />
                      Message
                    </button>
                    <button 
                      onClick={() => handleAction(() => setIsOfferModalOpen(true))} 
                      className="px-3 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark"
                    >
                        Make Offer
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-100 border-2 border-red-200 rounded-lg cursor-not-allowed">
                    <FaCheckCircle />
                    <span>Sold</span>
                  </div>
                )}
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