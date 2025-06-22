import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import InspectionModalTrigger from './InspectionModalTrigger';
import { FaBox, FaCheck, FaTruck } from 'react-icons/fa';
import { updateOrderStatusByAgent } from './actions';

type AssembledOrder = {
    id: number;
    status: string;
    item: { title: string }[] | null;
    seller: { username: string | null }[] | null;
    buyer: { username: string | null }[] | null;
};

const OrderCard = ({ order }: { order: AssembledOrder }) => {
    const markAsCollected = updateOrderStatusByAgent.bind(null, order.id, 'in_warehouse');
    const markAsDelivering = updateOrderStatusByAgent.bind(null, order.id, 'out_for_delivery');

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center gap-4">
            <div className="flex-grow">
                <p className="font-bold text-text-primary">Order #{order.id}</p>
                <p className="text-sm text-text-secondary truncate">{order.item?.[0]?.title || 'Item not found'}</p>
                <p className="text-xs mt-1 text-text-secondary">
                    {order.seller?.[0]?.username || 'N/A'} → {order.buyer?.[0]?.username || 'N/A'}
                </p>
            </div>
            
            <div className="flex-shrink-0">
                {['payment_authorized', 'awaiting_collection'].includes(order.status) && (
                    <form action={markAsCollected}>
                        <button type="submit" className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md whitespace-nowrap">
                            Mark as Collected
                        </button>
                    </form>
                )}
                {order.status === 'in_warehouse' && (
                    <InspectionModalTrigger orderId={order.id} />
                )}
                {order.status === 'inspection_passed' && (
                    <form action={markAsDelivering}>
                        <button type="submit" className="px-3 py-1 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md whitespace-nowrap">
                            Mark for Delivery
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default async function AgentDashboardPage() {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'agent' && profile?.role !== 'admin') {
        return <div className="text-center p-8 text-red-500">Access Denied. You are not an agent.</div>;
    }

    const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
            id,
            status,
            item:item_id ( title ),
            seller:seller_id ( username ),
            buyer:buyer_id ( username )
        `)
        .in('status', ['payment_authorized', 'awaiting_collection', 'in_warehouse', 'inspection_passed', 'out_for_delivery'])
        .order('created_at', { ascending: true });

    if (error) {
        return <p className="text-red-500 p-8 text-center">{error.message}</p>;
    }

    const assembledOrders: AssembledOrder[] = ordersData || [];
    
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