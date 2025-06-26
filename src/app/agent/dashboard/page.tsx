import { createClient } from '@/app/utils/supabase/server';
import { type Order, type Item } from '@/types';
import Link from 'next/link';
import AcceptTaskButton from './AcceptTaskButton';

export const dynamic = 'force-dynamic';

type AgentTask = Order & {
    items: Pick<Item, 'title' | 'id'> | null;
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'awaiting_assessment': return 'bg-blue-100 text-blue-800';
        case 'pending_admin_approval': return 'bg-yellow-100 text-yellow-800';
        case 'awaiting_collection': return 'bg-orange-100 text-orange-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        case 'payment_authorized': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
    <div className={`bg-gray-50 p-4 rounded-lg border-l-4 ${color}`}>
      <p className="text-sm text-text-secondary">{title}</p>
      <p className="text-3xl font-bold text-text-primary">{value}</p>
    </div>
);

export default async function AgentDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if(!user) return;

    // Fetch tasks already assigned to THIS agent
    const { data: myTasks, error: myTasksError } = await supabase
        .from('orders')
        .select(`*, items (id, title)`)
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

    // Fetch tasks available for ANY agent to accept
    const { data: availableTasks, error: availableTasksError } = await supabase
        .from('orders')
        .select('*, items(id, title)')
        .eq('status', 'payment_authorized')
        .is('agent_id', null)
        .order('created_at', { ascending: false });

    if (myTasksError || availableTasksError) {
        return <p className="text-red-500">Error fetching tasks.</p>;
    }

    const myAgentTasks = (myTasks || []) as AgentTask[];
    const activeTasks = myAgentTasks.filter(task => ['awaiting_assessment', 'pending_admin_approval', 'awaiting_collection'].includes(task.status));
    const pastTasks = myAgentTasks.filter(task => ['completed', 'cancelled'].includes(task.status));

    // --- FIX: Corrected and Clarified Stat Calculations ---
    const availableTasksCount = availableTasks.length;
    const myActiveAssignmentsCount = activeTasks.length;
    const myCompletedThisWeekCount = pastTasks.filter(t => new Date(t.updated_at!) > new Date(new Date().setDate(new Date().getDate() - 7))).length;
    // --- END OF FIX ---

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Agent Dashboard</h1>
            <p className="text-text-secondary mb-6">Manage new and assigned tasks.</p>

             {/* --- FIX: Updated Stat Cards with new labels and values --- */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatCard title="Available Tasks" value={availableTasksCount} color="border-green-500" />
                <StatCard title="My Active Assignments" value={myActiveAssignmentsCount} color="border-blue-500" />
                <StatCard title="I Completed This Week" value={myCompletedThisWeekCount} color="border-yellow-500" />
            </div>
             {/* --- END OF FIX --- */}

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-4">New Available Tasks ({availableTasks.length})</h2>
                <div className="bg-surface rounded-lg shadow-sm border overflow-hidden">
                    <table className="min-w-full">
                         <thead className="bg-gray-50 text-left text-sm font-semibold text-text-secondary">
                            <tr>
                                <th className="p-3">Order ID</th>
                                <th className="p-3">Item Name</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                            {availableTasks.length > 0 ? (
                                availableTasks.map(task => (
                                    <tr key={task.id}>
                                        <td className="p-3 font-mono text-xs">#{task.id}</td>
                                        <td className="p-3 font-medium">{task.items?.title || 'N/A'}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full capitalize bg-green-100 text-green-800">
                                                Ready for Assessment
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <AcceptTaskButton orderId={task.id} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-text-secondary">There are no new tasks available for assignment.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-4">My Active Tasks</h2>
                <div className="bg-surface rounded-lg shadow-sm border overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 text-left text-sm font-semibold text-text-secondary">
                            <tr>
                                <th className="p-3">Order ID</th>
                                <th className="p-3">Item Name</th>
                                <th className="p-3">Current Status</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                            {activeTasks.length > 0 ? (
                                activeTasks.map(task => (
                                    <tr key={task.id}>
                                        <td className="p-3 font-mono text-xs">#{task.id}</td>
                                        <td className="p-3 font-medium">{task.items?.title || 'N/A'}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusClass(task.status)}`}>
                                                {task.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <Link href={`/agent/dashboard/task/${task.id}`} className="px-3 py-1.5 text-xs font-semibold text-white bg-brand rounded-md hover:bg-brand-dark">
                                                {task.status === 'awaiting_assessment' ? 'File Report' : 'View Details'}
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-text-secondary">You have no active tasks assigned to you.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                 <h2 className="text-2xl font-bold text-text-primary mb-4">My Past Tasks</h2>
                <div className="bg-surface rounded-lg shadow-sm border overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 text-left text-sm font-semibold text-text-secondary">
                            <tr>
                                <th className="p-3">Order ID</th>
                                <th className="p-3">Item Name</th>
                                <th className="p-3">Final Status</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                            {pastTasks.length > 0 ? (
                                pastTasks.map(task => (
                                    <tr key={task.id}>
                                        <td className="p-3 font-mono text-xs">#{task.id}</td>
                                        <td className="p-3 font-medium">{task.items?.title || 'N/A'}</td>
                                        <td className="p-3">
                                             <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusClass(task.status)}`}>
                                                {task.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <Link href={`/agent/dashboard/task/${task.id}`} className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-700">
                                                View Report
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-text-secondary">You have no completed tasks.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}