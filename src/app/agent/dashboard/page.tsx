import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import InspectionModalTrigger from './InspectionModalTrigger';
import { FaTasks, FaClipboardList, FaBoxOpen } from 'react-icons/fa';
// FIX: Import the new server action
import { assignToAgentAction } from './actions';

type OrderForAgent = {
    id: number;
    status: string;
    items: { title: string } | null;
    seller: { username: string | null } | null;
};

// A component for a single order card on the dashboard
const OrderCard = ({ order }: { order: OrderForAgent }) => {
    // Bind the server action with the specific order ID
    const acceptTaskAction = assignToAgentAction.bind(null, order.id);

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center gap-4">
            <div className="flex-grow">
                <p className="font-bold text-text-primary">Order #{order.id}</p>
                <p className="text-sm text-text-secondary truncate">{order.items?.title || 'Item not found'}</p>
                <p className="text-xs mt-1 text-text-secondary">
                    Seller: <strong>{order.seller?.username || 'N/A'}</strong>
                </p>
            </div>
            
            <div className="flex-shrink-0">
                {/* Conditionally render the correct button based on the order status */}
                {order.status === 'payment_authorized' && (
                    <form action={acceptTaskAction}>
                        <button type="submit" className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md whitespace-nowrap">
                            Accept Task
                        </button>
                    </form>
                )}
                {order.status === 'awaiting_assessment' && (
                    <InspectionModalTrigger orderId={order.id} />
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

    // Fetch all orders that require an agent's attention
    const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
            id,
            status,
            items ( title ),
            seller:seller_id ( username )
        `)
        .in('status', ['payment_authorized', 'awaiting_assessment']) // Fetch both new and accepted tasks
        .order('created_at', { ascending: true });

    if (error) {
        return <p className="text-red-500 p-8 text-center">{error.message}</p>;
    }

    const agentOrders: OrderForAgent[] = (ordersData as any) || [];
    
    // Categorize orders into different lists
    const newTasks = agentOrders.filter(o => o.status === 'payment_authorized');
    const myTasks = agentOrders.filter(o => o.status === 'awaiting_assessment');

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-text-primary mb-8">Agent Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Column for New, Unassigned Tasks */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2"><FaTasks className="text-brand" /> New Assessment Tasks</h2>
                    {newTasks.length > 0 ? (
                        newTasks.map(order => <OrderCard key={order.id} order={order} />)
                    ) : <p className="text-text-secondary text-sm p-4 bg-gray-50 rounded-lg">No new tasks are available.</p>}
                </div>

                {/* Column for tasks accepted by the current agent */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2"><FaClipboardList className="text-brand" /> My Active Tasks</h2>
                    {myTasks.length > 0 ? (
                        myTasks.map(order => <OrderCard key={order.id} order={order} />)
                    ) : <p className="text-text-secondary text-sm p-4 bg-gray-50 rounded-lg">You have no active tasks.</p>}
                </div>
            </div>
        </div>
    );
}