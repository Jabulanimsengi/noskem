// File: app/agent/dashboard/page.tsx - Definitive Version

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import InspectionModal from './InspectionModal';

// This is the final, correct shape of the data we assemble
type AssembledOrder = {
    id: number;
    status: string;
    item: { title: string } | null;
    seller: { username: string | null } | null;
    buyer: { username: string | null } | null;
};

// Helper to format the status text
const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toUpperCase();
};

export default function AgentDashboardPage() {
    const supabase = createClient();
    const router = useRouter();
    const [orders, setOrders] = useState<AssembledOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    
    const handleFileReportClick = (orderId: number) => {
        setSelectedOrderId(orderId);
        setIsModalOpen(true);
    };

    // --- NEW, ROBUST DATA FETCHING LOGIC ---
    const fetchAgentData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
    
        // 1. First, fetch the core list of active orders.
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('id, status, item_id, seller_id, buyer_id')
            .in('status', ['payment_authorized', 'awaiting_collection', 'in_warehouse', 'inspection_passed', 'out_for_delivery'])
            .order('created_at', { ascending: true });
    
        if (ordersError) {
            setError(ordersError.message);
            setIsLoading(false);
            return;
        }
    
        // 2. Now, for each order, fetch the related details individually.
        const assembledOrders: AssembledOrder[] = await Promise.all(
            (ordersData || []).map(async (order) => {
                const { data: item } = await supabase
                    .from('items').select('title').eq('id', order.item_id).single();
                
                const { data: seller } = await supabase
                    .from('profiles').select('username').eq('id', order.seller_id).single();
                    
                const { data: buyer } = await supabase
                    .from('profiles').select('username').eq('id', order.buyer_id).single();
    
                return {
                    id: order.id,
                    status: order.status,
                    item,
                    seller,
                    buyer
                };
            })
        );
    
        setOrders(assembledOrders);
        setIsLoading(false);
    
    }, [supabase]);

    // Fetch data when the component first mounts
    useEffect(() => {
        const checkUserAndFetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }

            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role !== 'agent' && profile?.role !== 'admin') {
                setError('Access Denied. You are not an agent.');
                setIsLoading(false);
                return;
            }
            
            // If authorized, fetch the data.
            fetchAgentData();
        };

        checkUserAndFetch();
    }, [supabase, router, fetchAgentData]);
    
    if (isLoading) return <div className="text-center p-8">Loading Agent Dashboard...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <h1 className="text-3xl font-bold text-white mb-6">Agent Dashboard</h1>
            
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-x-auto">
                <table className="min-w-full text-left text-sm text-white">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4">Order ID</th>
                            <th className="p-4">Item</th>
                            <th className="p-4">Seller</th>
                            <th className="p-4">Buyer</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length > 0 ? (
                            orders.map(order => (
                                <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-4 font-mono">{order.id}</td>
                                    <td className="p-4 font-medium">{order.item?.title || 'N/A'}</td>
                                    <td className="p-4">{order.seller?.username || 'N/A'}</td>
                                    <td className="p-4">{order.buyer?.username || 'N/A'}</td>
                                    <td className="p-4">
                                        <span className="font-semibold px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                                            {formatStatus(order.status)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {/* This button will open the modal */}
                                        {order.status === 'in_warehouse' && (
                                            <button onClick={() => handleFileReportClick(order.id)} className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded-md">
                                                File Report
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-gray-400">No active orders requiring attention.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* The Modal is rendered here, but hidden until an order is selected */}
            {selectedOrderId && (
                 <InspectionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    orderId={selectedOrderId}
                />
            )}
        </div>
    );
}