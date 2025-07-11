// src/app/components/ItemCard.tsx

'use client';

import { useState, useTransition, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import { type ItemWithProfile } from '@/types';
import { FaCheckCircle, FaEye, FaHeart, FaHourglassHalf } from 'react-icons/fa';
import { MessageSquare, Tag, ShieldCheck } from 'lucide-react';
import { useChat, type ChatSession } from '@/context/ChatContext';
import { Button } from './Button';
import { useToast } from '@/context/ToastContext';
import { createCheckoutSession, type FormState } from '@/app/items/[id]/actions';
import { toggleLikeAction } from '@/app/likes/actions';
import { getGuestLikes, addGuestLike, removeGuestLike } from '@/utils/guestLikes';

const OfferModal = dynamic(() => import('./OfferModal'));

// FIX: Added the missing interface definition
interface ItemCardProps {
    item: ItemWithProfile;
    user: User | null;
    initialHasLiked?: boolean;
}

const createCanonicalRoomId = (userId1: string, userId2:string): string => {
    const sortedIds = [userId1, userId2].sort();
    return `chat_user_${sortedIds[0]}_${sortedIds[1]}`;
};

function BuyButtonForm({ item }: { item: ItemWithProfile }) {
    const { showToast } = useToast();
    const { pending } = useFormStatus();
    
    const initialState: FormState = { error: undefined, success: false, url: undefined };
    const [state, formAction] = useFormState(createCheckoutSession, initialState);

    useEffect(() => {
        if (state.error) {
            showToast(state.error, 'error');
        }
        if (state.success && state.url) {
            showToast('Redirecting to payment...', 'success');
            window.location.href = state.url;
        }
    }, [state, showToast]);

    return (
        <form action={formAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="itemPrice" value={item.buy_now_price || 0} />
            <Button size="sm" variant="primary" type="submit" disabled={pending} className="w-full text-sm sm:text-base">
                {pending ? '...' : 'Buy'}
            </Button>
        </form>
    );
}


export default function ItemCard({ item, user, initialHasLiked = false }: ItemCardProps) {
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [hasLiked, setHasLiked] = useState(initialHasLiked);
    const [isLiking, startLikeTransition] = useTransition();
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

    const finalImageUrl = (Array.isArray(item.images) && typeof item.images[0] === 'string' && item.images.length > 0)
        ? item.images[0]
        : 'https://placehold.co/600x400/27272a/9ca3af?text=No+Image';

    const sellerProfile = item.profiles;
    const sellerUsername = sellerProfile?.username || 'user';

    return (
        <>
            <div className="bg-surface rounded-xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-full">
                <div className="relative w-full h-40 sm:h-48">
                    <Link href={`/items/${item.id}`} className="block h-full">
                        <Image
                            src={finalImageUrl}
                            alt={item.title || 'Item Image'}
                            fill={true}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                        />
                    </Link>
                    <button
                        onClick={handleToggleLike}
                        disabled={isLiking}
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
                        aria-label="Like item"
                    >
                        <FaHeart className={`${hasLiked ? 'text-red-500' : 'text-white/80'}`} />
                    </button>

                    {item.status === 'sold' && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                            SOLD
                        </div>
                    )}
                    {item.status === 'pending_payment' && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                            PENDING
                        </div>
                    )}
                </div>
                <div className="p-3 sm:p-4 flex flex-col flex-grow">
                    <h3 className="text-base sm:text-lg font-bold text-text-primary truncate">
                        <Link href={`/items/${item.id}`} className="hover:underline">{item.title}</Link>
                    </h3>
                    
                    {/* HIDDEN ON MOBILE, VISIBLE ON DESKTOP (sm and up) */}
                    {sellerProfile && (
                        <div className="hidden sm:flex items-center justify-between mt-2">
                            <Link href={`/sellers/${sellerUsername}`} className="flex items-center gap-2 group/seller">
                                <span className="text-sm text-text-secondary group-hover/seller:text-brand group-hover/seller:underline">by {sellerUsername}</span>
                                {sellerProfile.verification_status === 'verified' && (
                                    <span title="Verified Seller">
                                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                                    </span>
                                )}
                            </Link>
                            <div className="flex items-center gap-1 text-xs text-text-secondary">
                                <FaEye />
                                <span>{item.view_count || 0}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex-grow mt-3">
                        <p className="text-xl sm:text-2xl font-extrabold text-brand">
                            {item.buy_now_price ? `R${item.buy_now_price.toFixed(2)}` : 'Make an Offer'}
                        </p>
                        {item.new_item_price && item.buy_now_price && item.new_item_price > item.buy_now_price && (
                            <p className="text-sm text-gray-500 line-through">
                                R{item.new_item_price.toFixed(2)}
                            </p>
                        )}
                    </div>

                    {/* HIDDEN ON MOBILE, VISIBLE ON DESKTOP (sm and up) */}
                    <div className="mt-auto pt-4 border-t border-gray-200 hidden sm:block">
                        {item.status === 'available' ? (
                            <div className="grid grid-cols-3 gap-2">
                                <Button size="sm" variant="secondary" onClick={handleStartChat} aria-label="Chat">
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => handleAction(() => setIsOfferModalOpen(true))}>
                                    <Tag className="h-4 w-4" />
                                    <span className="ml-1 hidden lg:inline">Offer</span>
                                </Button>
                                <BuyButtonForm item={item} />
                            </div>
                        ) : item.status === 'pending_payment' ? (
                            <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-orange-600 bg-orange-100 rounded-lg cursor-not-allowed">
                                <FaHourglassHalf />
                                <span>Pending Payment</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-100 rounded-lg cursor-not-allowed">
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