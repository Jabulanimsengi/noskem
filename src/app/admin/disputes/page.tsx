import { createAdminClient } from "@/app/utils/supabase/admin";
import Link from 'next/link';
import { FaUser } from "react-icons/fa";
import { type Order, type Item, type Profile } from "@/types";

type DisputedOrder = Order & {
    items: Pick<Item, 'title'> | null;
    buyer: Pick<Profile, 'username'> | null;
    seller: Pick<Profile, 'username'> | null;
}

export default async function AdminDisputesPage() {
    const supabase = createAdminClient();

    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id,
            created_at,
            final_amount,
            items (title),
            buyer:buyer_id (username),
            seller:seller_id (username)
        `)
        .eq('status', 'disputed')
        .order('created_at', { ascending: true });

    if (error) {
        return <p className="text-red-500">Error fetching disputes: {error.message}</p>;
    }

    const disputedOrders = orders as unknown as DisputedOrder[];

    return (
        <div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Disputed Orders</h2>
            <div className="bg-surface rounded-lg shadow-sm border overflow-hidden">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-text-secondary">
                        <tr>
                            <th className="p-3 font-semibold">Order</th>
                            <th className="p-3 font-semibold">Participants</th>
                            <th className="p-3 font-semibold">Amount</th>
                            <th className="p-3 font-semibold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {disputedOrders.length > 0 ? (
                            disputedOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="p-3">
                                        <p className="font-semibold text-text-primary">#{order.id}</p>
                                        <p className="text-xs text-text-secondary">{order.items?.title || 'Item not found'}</p>
                                    </td>
                                    <td className="p-3">
                                        <p className="flex items-center gap-2"><FaUser className="text-gray-400"/> Buyer: {order.buyer?.username}</p>
                                        <p className="flex items-center gap-2"><FaUser className="text-gray-400"/> Seller: {order.seller?.username}</p>
                                    </td>
                                    <td className="p-3 font-bold">R{order.final_amount.toFixed(2)}</td>
                                    <td className="p-3 text-right">
                                        <Link href={`/admin/disputes/${order.id}`} className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark">
                                            Review Case
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-text-secondary">
                                    There are no active disputes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}