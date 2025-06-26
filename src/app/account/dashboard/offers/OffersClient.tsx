'use client';

import { useState } from 'react';
// FIX: Ensure the import is from '@/types'
import { type OfferWithDetails } from '@/types';
import { FaArrowDown, FaArrowUp, FaCheck, FaGavel, FaTimes } from 'react-icons/fa';
import { acceptOfferAction, rejectOfferAction } from '@/app/offers/actions';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';
import Link from 'next/link';
import CounterOfferModal from '@/app/components/CounterOfferModal';
import { useLoading } from '@/context/LoadingContext';

interface OffersClientProps {
    receivedOffers: OfferWithDetails[];
    sentOffers: OfferWithDetails[];
    currentUserId: string;
}

// ... rest of the component code
// (The rest of the component logic can remain the same as provided previously)
const OfferRow = ({ offer, type, currentUserId }: { offer: OfferWithDetails, type: 'sent' | 'received', currentUserId: string }) => {
    const { showToast } = useToast();
    const { showLoader, hideLoader } = useLoading();
    const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);

    const item = offer.item;
    const otherUser = offer.seller_id === currentUserId ? offer.buyer : offer.seller;
    const isMyTurn = offer.status.startsWith('pending') && offer.last_offer_by !== currentUserId;
    
    const imageUrl = (item?.images && typeof item.images[0] === 'string') 
        ? item.images[0] 
        : 'https://placehold.co/150x150/27272a/9ca3af?text=No+Image';

    const handleAccept = async () => {
        showLoader();
        try {
            await acceptOfferAction(offer.id);
        } catch (e) {
            const err = e as Error;
            showToast(err.message, 'error');
        } finally {
            hideLoader();
        }
    };

    const handleReject = async () => {
        showLoader();
        try {
            await rejectOfferAction(offer.id);
            showToast('Offer rejected.', 'info');
        } catch (e) {
            const err = e as Error;
            showToast(err.message, 'error');
        } finally {
            hideLoader();
        }
    };
    
    return (
        <>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-b last:border-b-0">
                <Image 
                    src={imageUrl} 
                    alt={item?.title || 'Item image'} 
                    width={64} 
                    height={64} 
                    className="w-16 h-16 rounded-md object-cover flex-shrink-0" 
                />
                <div className="flex-grow text-center sm:text-left">
                    <p className="font-semibold">{item?.title}</p>
                    <p className="text-sm text-text-secondary">
                        With: <strong>{otherUser?.username || 'N/A'}</strong>
                    </p>
                    <p className="font-bold text-lg text-brand mt-1">R {offer.offer_amount.toFixed(2)}</p>
                     <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                        offer.status.includes('pending') ? 'bg-yellow-100 text-yellow-800' :
                        offer.status.includes('accepted') ? 'bg-green-100 text-green-800' :
                        offer.status.includes('rejected') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>{offer.status.replace(/_/g, ' ')}</span>
                </div>
                
                <div className="flex gap-2 flex-shrink-0 items-center">
                    {type === 'sent' && offer.status === 'accepted' && offer.order_id && (
                        <Link href={`/orders/${offer.order_id}`} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 whitespace-nowrap">
                            Proceed to Payment
                        </Link>
                    )}

                    {isMyTurn && (
                        <>
                            <form action={handleAccept}>
                               <button title="Accept" type="submit" className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full"><FaCheck /></button>
                            </form>
                            <form action={handleReject}>
                               <button title="Reject" type="submit" className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full"><FaTimes /></button>
                            </form>
                            <button title="Counter-offer" onClick={() => setIsCounterModalOpen(true)} className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full"><FaGavel /></button>
                        </>
                    )}
                </div>
            </div>
            {isCounterModalOpen && item && (
                 <CounterOfferModal 
                    isOpen={isCounterModalOpen}
                    onClose={() => setIsCounterModalOpen(false)}
                    offerId={offer.id}
                    currentItemTitle={item.title}
                    currentOfferAmount={offer.offer_amount}
                />
            )}
        </>
    )
};

export default function OffersClient({ receivedOffers, sentOffers, currentUserId }: OffersClientProps) {
    return (
        <div>
            <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><FaArrowDown className="text-green-500"/> Action Required</h3>
                <div className="bg-surface rounded-lg border">
                    {receivedOffers.length > 0 ? (
                        receivedOffers.map(o => <OfferRow key={o.id} offer={o} type="received" currentUserId={currentUserId} />)
                    ) : <p className="p-4 text-text-secondary text-sm">You have no offers that require your action.</p>}
                </div>
            </div>
            <div className="mt-8">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><FaArrowUp className="text-blue-500"/> Waiting for Others</h3>
                 <div className="bg-surface rounded-lg border">
                    {sentOffers.length > 0 ? (
                        sentOffers.map(o => <OfferRow key={o.id} offer={o} type="sent" currentUserId={currentUserId} />)
                    ) : <p className="p-4 text-text-secondary text-sm">You have no pending offers sent to others.</p>}
                </div>
            </div>
        </div>
    );
}