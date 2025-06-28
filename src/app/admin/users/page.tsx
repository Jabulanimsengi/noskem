import { createClient } from '../../utils/supabase/server';
import { createAdminClient } from '../../utils/supabase/admin';
import { redirect } from 'next/navigation';
import { FaCoins } from 'react-icons/fa';
import CreditAdjuster from './CreditAdjuster';
import RoleManager from './RoleManager';
import UserActions from './UserActions';
import { type Profile } from '@/types';
import { type User } from '@supabase/supabase-js';

type FullProfile = {
    id: string;
    email: string | undefined;
    username: string | null;
    role: string | null;
    credit_balance: number;
    created_at: string;
    banned_until: string | undefined;
};

export default async function UserManagementPage() {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) redirect('/?authModal=true');

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
    if (adminProfile?.role !== 'admin') {
        return <div className="text-center p-8 text-red-500">Access Denied. You are not an admin.</div>;
    }

    const { data: usersData, error: usersError } = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (usersError) {
        return <p className="text-red-500 text-center p-8">Error fetching users: {usersError.message}</p>;
    }

    const userIds = usersData.users.map(u => u.id);
    const { data: profilesData } = await supabase.from('profiles').select('*').in('id', userIds);

    const profilesMap = new Map(profilesData?.map((p: Profile) => [p.id, p]));

    const allUsers: FullProfile[] = usersData.users.map((user: User) => {
        const profile = profilesMap.get(user.id);
        return {
            id: user.id,
            email: user.email,
            username: profile?.username || 'N/A',
            role: profile?.role || 'user',
            credit_balance: profile?.credit_balance || 0,
            created_at: user.created_at,
            banned_until: (user as { banned_until?: string }).banned_until,
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
                            <th className="p-4 font-semibold">Role & Credits</th>
                            <th className="p-4 font-semibold">Credit Adjustment</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allUsers.map(user => (
                            <tr key={user.id} className="border-b last:border-b-0">
                                <td className="p-4 align-top">
                                    <p className="font-semibold">{user.username}</p>
                                    <p className="text-text-secondary">{user.email}</p>
                                    <p className="text-xs text-text-secondary mt-1">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                                    {user.banned_until && new Date(user.banned_until) > new Date() && (
                                        <p className="text-xs text-red-500 font-bold mt-1">SUSPENDED</p>
                                    )}
                                </td>
                                <td className="p-4 align-top">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FaCoins className="text-yellow-500" />
                                        <span className="font-bold">{user.credit_balance}</span>
                                    </div>
                                    <RoleManager userId={user.id} currentRole={user.role || 'user'} />
                                </td>
                                <td className="p-4 align-top">
                                    <CreditAdjuster userId={user.id} />
                                </td>
                                <td className="p-4 align-top text-right">
                                    <UserActions
                                      userId={user.id}
                                      isBanned={!!(user.banned_until && new Date(user.banned_until) > new Date())}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}