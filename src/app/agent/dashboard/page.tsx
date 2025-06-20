// File: app/agent/dashboard/page.tsx

import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import InspectionModalTrigger from './InspectionModalTrigger';
import { FaBox, FaCheck, FaTruck } from 'react-icons/fa';

// This is the shape of the data we will assemble
type AssembledOrder = {
    id: number;
    status: string;
    item: { title: string } | null;
    seller: { username: string | null } | null;
    buyer: { username: string | null } | null;
};

// A reusable card component for displaying order info
const OrderCard = ({ order }: { order: AssembledOrder }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center gap-4">
        <div className="flex-grow">
            <p className="font-bold text-text-primary">Order #{order.id}</p>
            <p className="text-sm text-text-secondary truncate">{order.item?.title || 'Item not found'}</p>
            <p className="text-xs mt-1 text-text-secondary">
                {order.seller?.username || 'N/A'} → {order.buyer?.username || 'N/A'}
            </p>
        </div>
        {order.status === 'in_warehouse' && (
            <div className="flex-shrink-0">
                 <InspectionModalTrigger orderId={order.id} />
            </div>
        )}
    </div>
);

export default async function AgentDashboardPage() {
    const supabase = await createClient();
    
    // 1. Authorization check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { redirect('/auth'); }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'agent' && profile?.role !== 'admin') {
        return <div className="text-center p-8 text-red-500">Access Denied. You are not an agent.</div>;
    }

    // 2. Fetch the base list of orders first
    const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, status, item_id, seller_id, buyer_id')
        .in('status', ['payment_authorized', 'awaiting_collection', 'in_warehouse', 'inspection_passed', 'out_for_delivery'])
        .order('created_at', { ascending: true });

    if (error) {
        return <p className="text-red-500 p-8 text-center">{error.message}</p>;
    }

    // 3. Assemble the full details for each order.
    // This method is more robust and guarantees the correct data shape.
    const assembledOrders: AssembledOrder[] = await Promise.all(
        (ordersData || []).map(async (order) => {
            const { data: item } = await supabase.from('items').select('title').eq('id', order.item_id).single();
            const { data: seller } = await supabase.from('profiles').select('username').eq('id', order.seller_id).single();
            const { data: buyer } = await supabase.from('profiles').select('username').eq('id', order.buyer_id).single();
            return { id: order.id, status: order.status, item, seller, buyer };
        })
    );
    
    // 4. Group orders by status for better organization
    const ordersInWarehouse = assembledOrders.filter(o => o.status === 'in_warehouse');
    const ordersForDelivery = assembledOrders.filter(o => o.status === 'inspection_passed');
    const ordersAwaitingCollection = assembledOrders.filter(o => ['payment_authorized', 'awaiting_collection'].includes(o.status));

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-text-primary mb-8">Agent Dashboard</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2"><FaBox className="text-brand" /> Items to Collect</h2>
                    {ordersAwaitingCollection.length > 0 ? (
                        ordersAwaitingCollection.map(order => <OrderCard key={order.id} order={order} />)
                    ) : <p className="text-text-secondary text-sm">No items are currently awaiting collection.</p>}
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2"><FaCheck className="text-brand" /> Needs Inspection</h2>
                    {ordersInWarehouse.length > 0 ? (
                        ordersInWarehouse.map(order => <OrderCard key={order.id} order={order} />)
                    ) : <p className="text-text-secondary text-sm">No items are awaiting inspection.</p>}
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2"><FaTruck className="text-brand" /> Ready for Delivery</h2>
                    {ordersForDelivery.length > 0 ? (
                        ordersForDelivery.map(order => <OrderCard key={order.id} order={order} />)
                    ) : <p className="text-text-secondary text-sm">No items have passed inspection.</p>}
                </div>
            </div>
        </div>
    );
}