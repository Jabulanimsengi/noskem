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

    // FIX: The query now explicitly selects the new 'order_id' column
    // along with all other necessary details.
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

    const offers = offersData as OfferWithDetails[];

    const receivedOffers = offers.filter(o => o.seller_id === user.id);
    const sentOffers = offers.filter(o => o.buyer_id === user.id);
    
    return (
        <OffersClient 
            receivedOffers={receivedOffers}
            sentOffers={sentOffers}
            currentUserId={user.id}
        />
    );
}