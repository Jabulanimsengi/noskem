/**
 * REFACTOR: This page is now a Server Component for better performance.
 * It fetches data on the server and passes it to a new `OrdersClient` component
 * for interactive rendering, matching the modern pattern used elsewhere in the app.
 */
import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import OrdersClient from './OrdersClient'; // We will create this client component below

// The data type, can be moved to a central types file later
export type OrderWithDetails = any; // Using 'any' for simplicity, can be tightened later

export default async function MyOrdersPage() {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return redirect('/?authModal=true');
    }
    
    // Fetch data directly on the server
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

    // Pass server-fetched data as props to the client component
    return (
        <OrdersClient 
            userId={user.id}
            initialBuyingOrders={buyingOrders}
            initialSellingOrders={sellingOrders}
        />
    );
}