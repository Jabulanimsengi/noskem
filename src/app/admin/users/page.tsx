// File: app/admin/users/page.tsx

import { createClient } from '../../utils/supabase/server';
import { createAdminClient } from '../../utils/supabase/admin';
import { redirect } from 'next/navigation';
import { updateUserRole, adjustCreditsAction } from './actions';
import { FaCoins } from 'react-icons/fa';

type FullProfile = {
    id: string;
    email: string | undefined;
    username: string | null;
    role: string | null;
    credit_balance: number;
    created_at: string;
};

// A client component for the credit adjustment form for better UX
const CreditAdjuster = ({ userId }: { userId: string }) => {
    return (
        <form action={adjustCreditsAction} className="flex items-center gap-2">
            <input type="hidden" name="userId" value={userId} />
            <input 
                type="number" 
                name="amount" 
                placeholder="Amount"
                className="w-20 px-2 py-1 text-sm border-gray-300 rounded-md"
                required
            />
            <input 
                type="text" 
                name="notes" 
                placeholder="Reason"
                className="flex-grow px-2 py-1 text-sm border-gray-300 rounded-md"
                required
            />
            <button type="submit" className="px-3 py-1 text-sm font-semibold text-white bg-brand rounded-md hover:bg-brand-dark">
                Adjust
            </button>
        </form>
    )
}

export default async function UserManagementPage() {
    const supabase = await createClient();
    const adminSupabase = createAdminClient(); 

    // 1. Protect the route
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) redirect('/auth');

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
    if (adminProfile?.role !== 'admin') {
        return <div className="text-center p-8 text-red-500">Access Denied. You are not an admin.</div>;
    }

    // 2. Fetch all users and profiles
    const { data: usersData, error: usersError } = await adminSupabase.auth.admin.listUsers();
    if (usersError) {
        return <p className="text-red-500 text-center p-8">Error fetching users: {usersError.message}</p>;
    }
    
    const { data: profilesData } = await adminSupabase.from('profiles').select('*');
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

    const allUsers: FullProfile[] = usersData.users.map(user => {
        const profile = profilesMap.get(user.id);
        return {
            id: user.id, email: user.email, username: profile?.username || 'N/A',
            role: profile?.role || 'user', credit_balance: profile?.credit_balance || 0,
            created_at: user.created_at,
        };
    });

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">User Management</h1>
            <div className="bg-surface rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full text-left text-sm text-text-primary">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-4 font-semibold">User</th>
                            <th className="p-4 font-semibold">Role</th>
                            <th className="p-4 font-semibold">Credit Adjustment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allUsers.map(user => (
                            <tr key={user.id} className="border-b">
                                <td className="p-4 align-top">
                                    <p className="font-semibold">{user.username}</p>
                                    <p className="text-text-secondary">{user.email}</p>
                                    <p className="text-xs text-text-secondary mt-1">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                                </td>
                                <td className="p-4 align-top">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FaCoins className="text-yellow-500" />
                                        <span className="font-bold">{user.credit_balance}</span>
                                    </div>
                                    <form action={updateUserRole} className="flex items-center gap-2">
                                        <input type="hidden" name="userId" value={user.id} />
                                        <select name="newRole" defaultValue={user.role || 'user'} className="bg-white border border-gray-300 rounded-md px-2 py-1 text-xs">
                                            <option value="user">User</option>
                                            <option value="agent">Agent</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <button type="submit" className="px-3 py-1 text-xs font-semibold text-white bg-gray-600 hover:bg-gray-700 rounded-md">Save Role</button>
                                    </form>
                                </td>
                                <td className="p-4 align-top">
                                    <CreditAdjuster userId={user.id} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}