// src/app/components/ItemCard.tsx

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';
import { FaCheckCircle, FaEye, FaHeart, FaHourglassHalf } from 'react-icons/fa';
import { MessageSquare, Tag } from 'lucide-react';
import { useChat, type ChatSession } from '@/context/ChatContext';
import { Button } from './Button';
import { useToast } from '@/context/ToastContext';
import { createCheckoutSession } from '@/app/items/[id]/actions';
import { toggleLikeAction } from '@/app/likes/actions';
import { getGuestLikes, addGuestLike, removeGuestLike } from '@/utils/guestLikes';

const OfferModal = dynamic(() => import('./OfferModal'));

const createCanonicalRoomId = (userId1: string, userId2: string): string => {
    const sortedIds = [userId1, userId2].sort();
    return `chat_user_${sortedIds[0]}_${sortedIds[1]}`;
};

interface ItemCardProps {
    item: ItemWithProfile;
    user: User | null;
    initialHasLiked?: boolean;
}

export default function ItemCard({ item, user, initialHasLiked = false }: ItemCardProps) {
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [hasLiked, setHasLiked] = useState(initialHasLiked);
    const [isLiking, startLikeTransition] = useTransition();
    const [isBuying, startBuyTransition] = useTransition(); // Transition for the buy action
    const { openModal } = useAuthModal();
    const { openChat } = useChat();
    const { showToast } = useToast();

    const handleAction = (callback: () => void) => {
        if (!user) {
            openModal('sign_in');
        } else {
            callback();
        }
    };

    const handleToggleLike = () => {
        if (user) {
            startLikeTransition(async () => {
                const result = await toggleLikeAction(item.id);
                if(result.success) {
                    setHasLiked(!!result.liked);
                    showToast(result.liked ? 'Added to your liked items!' : 'Removed from liked items.', 'success');
                } else if (result.error) {
                    showToast(result.error, 'error');
                }
            });
        } else {
            if (hasLiked) {
                removeGuestLike(item.id);
                setHasLiked(false);
                showToast('Removed from liked items.', 'success');
            } else {
                addGuestLike(item.id);
                setHasLiked(true);
                showToast('Added to your liked items!', 'success');
            }
        }
    };

    const handleStartChat = () => {
        handleAction(() => {
            if (!user || user.id === item.seller_id) return;
            const roomId = createCanonicalRoomId(user.id, item.seller_id);
            const chatSession: ChatSession = {
                roomId: roomId,
                recipientId: item.seller_id,
                recipientUsername: item.profiles?.username || 'Seller',
                recipientAvatar: item.profiles?.avatar_url || null,
                itemTitle: `About: ${item.title}`,
            };
            openChat(chatSession);
        });
    };

    const handleBuyNow = () => {
        handleAction(() => {
            startBuyTransition(async () => {
                if (!item.buy_now_price) {
                    showToast("This item isn't available for direct purchase.", "error");
                    return;
                }

                showToast('Processing...', 'info');
                const formData = new FormData();
                formData.append('itemId', item.id.toString());
                formData.append('itemPrice', item.buy_now_price.toString());
                
                // Call the simplified server action
                const result = await createCheckoutSession(formData);
                
                if (result?.error) {
                    showToast(result.error, 'error');
                } else if (result?.success && result.url) {
                    showToast('Redirecting to payment gateway...', 'success');
                    // Perform redirect on the client
                    window.location.href = result.url;
                }
            });
        });
    };

    const finalImageUrl = (Array.isArray(item.images) && typeof item.images[0] === 'string' && item.images.length > 0)
        ? item.images[0]
        : 'https://placehold.co/600x400/27272a/9ca3af?text=No+Image';

    const sellerProfile = item.profiles;
    const sellerUsername = sellerProfile?.username || 'user';

    return (
        <>
            <div className="bg-surface rounded-xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-full">
                <div className="relative w-full h-48">
                    <Link href={`/items/${item.id}`} className="block h-full">
                        <Image
                            src={finalImageUrl}
                            alt={item.title || 'Item Image'}
                            fill={true}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                        />
                    </Link>
                    <button
                        onClick={handleToggleLike}
                        disabled={isLiking}
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                        aria-label="Like item"
                    >
                        <FaHeart className={`${hasLiked ? 'text-red-500' : 'text-white/80'}`} />
                    </button>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-text-primary truncate">{item.title}</h3>

                    {sellerProfile && (
                        <div className="flex items-center justify-between mt-2">
                            <Link href={`/sellers/${sellerUsername}`} className="flex items-center gap-2 group/seller">
                                <span className="text-sm text-text-secondary group-hover/seller:text-brand group-hover/seller:underline">by {sellerUsername}</span>
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

                    <div className="mt-auto pt-4 border-t border-gray-200">
                        {item.status === 'available' ? (
                            <div className="grid grid-cols-3 gap-2">
                                <Button size="sm" variant="secondary" onClick={handleStartChat}>
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => handleAction(() => setIsOfferModalOpen(true))}>
                                    <Tag className="h-4 w-4" />
                                    <span className="ml-1">Offer</span>
                                </Button>
                                <Button size="sm" variant="primary" onClick={handleBuyNow} disabled={isBuying}>
                                    {isBuying ? '...' : 'Buy'}
                                </Button>
                            </div>
                        ) : item.status === 'pending_payment' ? (
                            <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-orange-600 bg-orange-100 border-2 border-orange-200 rounded-lg cursor-not-allowed">
                                <FaHourglassHalf />
                                <span>Pending Payment</span>
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