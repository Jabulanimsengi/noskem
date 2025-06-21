'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../utils/supabase/client';
import { type User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaCheck, FaTimes, FaGavel } from 'react-icons/fa';
import { acceptOfferAction, rejectOfferAction } from '../../../offers/actions';
import CounterOfferModal from '../../../components/CounterOfferModal';

// Define the shape of the offer data we expect
type OfferWithDetails = {
  id: number;
  offer_amount: number;
  status: string;
  last_offer_by: string;
  buyer_id: string; 
  seller_id: string; 
  item: {
    id: number;
    title: string;
    images: string[] | null;
  } | null;
  buyer: {
    username: string;
  } | null;
  seller: {
    username: string;
  } | null;
};

// A reusable component for each offer row
const OfferRow = ({ offer, perspective, currentUserId }: { offer: OfferWithDetails; perspective: 'buyer' | 'seller', currentUserId: string }) => {
    const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
    
    const imageUrl = (offer.item?.images && offer.item.images.length > 0) ? offer.item.images[0] : 'https://placehold.co/150x150';
    
    const isMyTurn = offer.last_offer_by !== currentUserId && offer.status.startsWith('pending');
    
    return (
        <>
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-4">
                <div className="flex items-center gap-4 w-full">
                    <Image src={imageUrl} alt={offer.item?.title || ''} width={64} height={64} className="rounded-md object-cover flex-shrink-0" unoptimized />
                    <div className="flex-grow">
                        <p className="font-semibold text-text-primary truncate">{offer.item?.title || 'Item Not Found'}</p>
                        <p className="text-sm text-text-secondary">
                            {perspective === 'buyer' ? `Offer to ${offer.seller?.username}` : `Offer from ${offer.buyer?.username}`}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-end">
                    <div className="text-left sm:text-right">
                        <p className="font-bold text-lg text-brand">R{offer.offer_amount.toFixed(2)}</p>
                        <p className="text-xs font-semibold px-2 py-1 bg-blue-400/20 text-blue-600 rounded-full mt-1 inline-block">
                            {offer.status.replace(/_/g, ' ').toUpperCase()}
                        </p>
                    </div>
                    {isMyTurn && (
                        <div className="flex gap-2 items-center">
                            <form action={acceptOfferAction.bind(null, offer.id)}>
                                <button type="submit" title="Accept Offer" className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full"><FaCheck /></button>
                            </form>
                            <form action={rejectOfferAction.bind(null, offer.id)}>
                                <button type="submit" title="Reject Offer" className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full"><FaTimes /></button>
                            </form>
                            {perspective === 'seller' && (
                                 <button onClick={() => setIsCounterModalOpen(true)} type="button" title="Make Counter-Offer" className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full"><FaGavel /></button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {isCounterModalOpen && offer.item && (
                <CounterOfferModal 
                    isOpen={isCounterModalOpen}
                    onClose={() => setIsCounterModalOpen(false)}
                    offerId={offer.id}
                    currentItemTitle={offer.item.title}
                    currentOfferAmount={offer.offer_amount}
                />
            )}
        </>
    );
};

export default function MyOffersPage() {
    const [user, setUser] = useState<User | null>(null);
    const [offers, setOffers] = useState<OfferWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        const getOffers = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                return router.push('/?authModal=true'); 
            }
            setUser(currentUser);

            const { data: offersData, error } = await supabase
                .from('offers')
                .select(`*, item:items!inner(id, title, images), buyer:buyer_id!inner(username), seller:seller_id!inner(username)`)
                .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("Error loading offers:", error);
            } else {
                setOffers(offersData as OfferWithDetails[]);
            }
            setIsLoading(false);
        };
        getOffers();
    // --- FIX: The dependency array is now empty to prevent an infinite loop ---
    }, []);

    if (isLoading) {
        return <div className="text-center text-text-secondary py-10">Loading offers...</div>
    }

    if (!user) {
        return null; // Don't render anything while redirecting
    }

    const offersMade = offers.filter(o => o.buyer_id === user.id);
    const offersReceived = offers.filter(o => o.seller_id === user.id);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">Offers I've Received</h2>
                <div className="space-y-4">
                    {offersReceived.length > 0 
                        ? offersReceived.map(o => <OfferRow key={o.id} offer={o} perspective="seller" currentUserId={user.id} />) 
                        : <p className="text-text-secondary text-center py-4">You have not received any offers.</p>}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">Offers I've Made</h2>
                <div className="space-y-4">
                    {offersMade.length > 0 
                        ? offersMade.map(o => <OfferRow key={o.id} offer={o} perspective="buyer" currentUserId={user.id} />) 
                        : <p className="text-text-secondary text-center py-4">You have not made any offers.</p>}
                </div>
            </div>
        </div>
    );
}