import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { type OfferWithDetails } from '@/types';
import OffersClient from './OffersClient';

export default async function MyOffersPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/?authModal=true');
    }

    const { data: offersData, error } = await supabase
        .from('offers')
        .select(`
            *,
            item:item_id (*, profiles:profiles!items_seller_id_fkey(id, username, avatar_url)),
            buyer:buyer_id (*),
            seller:seller_id (*)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching offers:", error);
        return <div className="p-4 text-center text-red-500">Error fetching offers: {error.message}</div>;
    }

    const offers = (offersData || []) as OfferWithDetails[];

    const receivedOffers = offers.filter(o => o.last_offer_by !== user.id && o.status.startsWith('pending'));
    const sentOffers = offers.filter(o => o.last_offer_by === user.id && o.status.startsWith('pending'));
    
    return (
        <OffersClient 
            receivedOffers={receivedOffers}
            sentOffers={sentOffers}
            currentUserId={user.id}
        />
    );
}