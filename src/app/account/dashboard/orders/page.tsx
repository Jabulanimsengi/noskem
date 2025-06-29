import { createClient } from "@/utils/supabase/server";
import OrdersClient from "./OrdersClient";
import { type OrderWithItemAndProfile, type Perspective } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"; // Corrected import path
import PageHeader from "@/app/components/PageHeader";

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <p className="text-center py-12">Please log in to see your orders.</p>;
    }

    const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`*, item:items!inner(id, title, images), seller_profile:seller_id(*), buyer_profile:buyer_id(*)`)
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading orders:", error);
        return <div className="text-center text-text-secondary py-10">Error loading orders.</div>;
    }

    const allOrders: OrderWithItemAndProfile[] = (ordersData as any) || [];
    const buyingOrders = allOrders.filter(o => o.buyer_id === user.id);
    const sellingOrders = allOrders.filter(o => o.seller_id === user.id);

    return (
        <div>
            {/* Corrected PageHeader call */}
            <PageHeader title="My Orders" description="Track and manage all your purchases and sales." />
            
            <Tabs defaultValue="buying" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buying">My Purchases</TabsTrigger>
                    <TabsTrigger value="selling">My Sales</TabsTrigger>
                </TabsList>
                <TabsContent value="buying" className="mt-6">
                    <OrdersClient orders={buyingOrders} perspective="buying" />
                </TabsContent>
                <TabsContent value="selling" className="mt-6">
                    <OrdersClient orders={sellingOrders} perspective="selling" />
                </TabsContent>
            </Tabs>
        </div>
    );
}