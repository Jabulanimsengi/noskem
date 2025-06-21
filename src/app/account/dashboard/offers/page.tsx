import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { type OfferWithDetails } from '@/types';
import OffersClient from './OffersClient'; // We will create this client component

// FIX: This page is now an async Server Component.
export default async function MyOffersPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth');
    }

    // It fetches its own data directly on the server.
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

    // We now have all the data needed on the server side.
    const offers = offersData as OfferWithDetails[];

    const receivedOffers = offers.filter(o => o.seller_id === user.id);
    const sentOffers = offers.filter(o => o.buyer_id === user.id);
    
    // It passes the server-fetched data to a Client Component that contains the UI logic.
    return (
        <OffersClient 
            receivedOffers={receivedOffers}
            sentOffers={sentOffers}
            currentUserId={user.id}
        />
    );
}