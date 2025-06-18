// File: app/admin/users/page.tsx

import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { updateUserRole } from './actions';

// Define the shape of a full user profile for TypeScript
type FullProfile = {
    id: string;
    email: string | undefined; // Email comes from the auth table
    username: string | null;
    first_name: string | null;
    company_name: string | null;
    role: string | null;
    credit_balance: number;
    created_at: string;
};

// A small client component for the role change form
const RoleChanger = ({ userId, currentRole }: { userId: string, currentRole: string | null }) => {
    return (
        <form action={updateUserRole} className="flex gap-2">
            <input type="hidden" name="userId" value={userId} />
            <select
                name="newRole"
                defaultValue={currentRole || 'user'}
                className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-xs"
            >
                <option value="user">User</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
            </select>
            <button type="submit" className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 rounded-md">
                Save
            </button>
        </form>
    );
};

export default async function UserManagementPage() {
    const supabase = await createClient();

    // 1. Protect the route by checking if the current user is an admin.
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) redirect('/auth');

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
    if (adminProfile?.role !== 'admin') {
        return <div className="text-center p-8 text-red-500">Access Denied. You are not an admin.</div>;
    }

    // 2. Fetch ALL user profiles and their corresponding emails from the auth table.
    const { data: usersData, error } = await supabase.auth.admin.listUsers();
    if (error) {
        return <p className="text-red-500 text-center p-8">Error fetching users.</p>;
    }
    
    const { data: profilesData } = await supabase.from('profiles').select('*');
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

    const allUsers: FullProfile[] = usersData.users.map(user => {
        const profile = profilesMap.get(user.id);
        return {
            id: user.id,
            email: user.email,
            username: profile?.username || 'N/A',
            first_name: profile?.first_name || 'N/A',
            company_name: profile?.company_name || 'N/A',
            role: profile?.role || 'user',
            credit_balance: profile?.credit_balance || 0,
            created_at: user.created_at,
        };
    });

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <h1 className="text-3xl font-bold text-white mb-6">User Management</h1>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-x-auto">
                <table className="min-w-full text-left text-sm text-white">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4">Email</th>
                            <th className="p-4">Username / Company</th>
                            <th className="p-4">Credits</th>
                            <th className="p-4">Joined On</th>
                            <th className="p-4">Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allUsers.map(user => (
                            <tr key={user.id} className="border-b border-gray-700">
                                <td className="p-4 font-mono text-xs">{user.email}</td>
                                <td className="p-4 font-medium">{user.username}</td>
                                <td className="p-4 font-bold text-yellow-400">{user.credit_balance}</td>
                                <td className="p-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <RoleChanger userId={user.id} currentRole={user.role} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}