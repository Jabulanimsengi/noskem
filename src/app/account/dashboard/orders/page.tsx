// src/app/account/dashboard/orders/page.tsx
import { createClient } from '@/utils/supabase/server'; // Fixed: Added 'from'
import { redirect } from 'next/navigation';
import OrdersClient from './OrdersClient';
import { type OrderWithDetails } from '@/types';
import PageHeader from '@/app/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

export const dynamic = 'force-dynamic';

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
        <div>
            <PageHeader title="My Orders" />
            <Tabs defaultValue="buying" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buying">My Purchases</TabsTrigger>
                    <TabsTrigger value="selling">My Sales</TabsTrigger>
                </TabsList>
                <TabsContent value="buying" className="mt-4">
                    <OrdersClient 
                        initialOrders={buyingOrders}
                        perspective="buying"
                        currentUser={user} /* [INFO]: Passing currentUser */ // Fixed: Changed comment syntax
                    />
                </TabsContent>
                <TabsContent value="selling" className="mt-4">
                     <OrdersClient 
                        initialOrders={sellingOrders}
                        perspective="selling"
                        currentUser={user} /* [INFO]: Passing currentUser */ // Fixed: Changed comment syntax
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}