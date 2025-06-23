import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { type OfferWithDetails } from '@/types';
import OffersClient from './OffersClient';

export default async function MyOffersPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth');
    }

    const { data: offersData, error } = await supabase
        .from('offers')
        .select(`
            *,
            item:item_id (*, profiles (id, username)),
            buyer:buyer_id (*),
            seller:seller_id (*)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    if (error) {
        return <p className="text-red-500">Error fetching offers: {error.message}</p>;
    }

    const offers = (offersData || []) as OfferWithDetails[];

    // --- FIX: Correctly categorize offers based on who made the last move ---
    // An offer is "received" if the user is a participant AND the last offer was NOT made by them.
    const receivedOffers = offers.filter(o => o.last_offer_by !== user.id);
    // An offer is "sent" if the last offer WAS made by them.
    const sentOffers = offers.filter(o => o.last_offer_by === user.id);
    // --- END OF FIX ---
    
    return (
        <OffersClient 
            receivedOffers={receivedOffers}
            sentOffers={sentOffers}
            currentUserId={user.id}
        />
    );
}