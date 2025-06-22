import { createAdminClient } from '@/app/utils/supabase/admin';
import { FaEnvelope, FaClock } from 'react-icons/fa';

export default async function AdminUnconfirmedUsersPage() {
  const adminSupabase = createAdminClient();

  // Use the admin client to list all users from the auth schema
  const { data, error } = await adminSupabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000, // Get up to 1000 users
  });

  if (error) {
    return <p className="text-red-500">Error fetching users: {error.message}</p>;
  }

  // Filter the list to find only users who have not confirmed their email
  const unconfirmedUsers = data.users.filter(user => !user.email_confirmed_at);

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Users Awaiting Email Confirmation</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 font-semibold">User Email</th>
              <th className="p-3 font-semibold">Signed Up On</th>
              <th className="p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {unconfirmedUsers.length > 0 ? (
              unconfirmedUsers.map(user => (
                <tr key={user.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="p-3 font-medium text-text-primary">
                    <div className="flex items-center gap-2">
                        <FaEnvelope className="text-gray-400" />
                        <span>{user.email}</span>
                    </div>
                  </td>
                  <td className="p-3 text-text-secondary">
                    <div className="flex items-center gap-2">
                        <FaClock className="text-gray-400" />
                        <span>{new Date(user.created_at).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Awaiting Confirmation
                    </span>
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan={3} className="text-center p-8 text-text-secondary">
                        There are no users awaiting email confirmation.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}