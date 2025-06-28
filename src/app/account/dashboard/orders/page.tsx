import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import OrdersClient from './OrdersClient';
// FIX: This import should now work correctly.
import { type OrderWithDetails } from '@/types';

export default async function MyOrdersPage() {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return redirect('/?authModal=true');
    }
    
    const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`*, item:items!inner(id, title, images), seller:seller_id(*), buyer:buyer_id(*), reviews(id)`)
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading orders:", error);
        return <div className="text-center text-text-secondary py-10">Error loading orders.</div>;
    }
    
    const orders = (ordersData as OrderWithDetails[]) || [];
    const buyingOrders = orders.filter(o => o.buyer_id === user.id);
    const sellingOrders = orders.filter(o => o.seller_id === user.id);

    return (
        <OrdersClient 
            userId={user.id}
            initialBuyingOrders={buyingOrders}
            initialSellingOrders={sellingOrders}
        />
    );
}