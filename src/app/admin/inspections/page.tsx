import { createClient } from '@/app/utils/supabase/server';
import ApprovalActions from './ApprovalActions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminInspectionsPage() {
    const supabase = await createClient();

    const { data: ordersWithPendingInspections, error } = await supabase
        .from('orders')
        .select(`
            id,
            created_at,
            items ( title ),
            agent:profiles!orders_agent_id_fkey ( username ),
            inspections ( * )
        `)
        .eq('status', 'pending_admin_approval')
        .not('inspections', 'is', null)
        .order('created_at', { ascending: true });

    if (error) {
        return <p className="text-red-500 p-4">Error fetching reports for approval: {error.message}</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Inspection Reports for Approval</h1>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4 text-left text-sm font-semibold text-gray-600">Order ID</th>
                            <th className="p-4 text-left text-sm font-semibold text-gray-600">Item</th>
                            <th className="p-4 text-left text-sm font-semibold text-gray-600">Agent</th>
                            <th className="p-4 text-left text-sm font-semibold text-gray-600">Verdict</th>
                            <th className="p-4 text-left text-sm font-semibold text-gray-600">Submitted At</th>
                            <th className="p-4 text-right text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {ordersWithPendingInspections.length > 0 ? (
                            ordersWithPendingInspections.map(order => {
                                const report = order.inspections[0];
                                if (!report) return null;

                                return (
                                    <tr key={report.id}>
                                        <td className="p-4 font-mono text-xs">
                                            <Link href={`/admin/orders/${order.id}`} className="hover:underline text-blue-600">
                                                #{order.id}
                                            </Link>
                                        </td>
                                        <td className="p-4 font-medium">{order.items?.[0]?.title || 'N/A'}</td>
                                        {/* FIX: Access the first element of the 'agent' array with [0] */}
                                        <td className="p-4">{order.agent?.[0]?.username || 'N/A'}</td>
                                        <td className={`p-4 font-bold ${report.final_verdict === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                            {report.final_verdict === 'approved' ? 'PASS' : 'FAIL'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">{new Date(report.created_at).toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <ApprovalActions inspectionId={report.id} orderId={order.id} />
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-gray-500 italic">
                                    There are no inspection reports pending approval.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}