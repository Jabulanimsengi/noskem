import { createClient } from '../utils/supabase/server';
import { redirect } from 'next/navigation';
import AdminNav from './AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/?authModal=true');
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return (
        <div className="container mx-auto text-center p-12">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-text-secondary mt-2">You do not have permission to view the admin panel.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary">Admin Panel</h1>
        <p className="mt-1 text-lg text-text-secondary">Manage all aspects of the marketplace.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <AdminNav />
        </aside>

        <main className="lg:col-span-9">
          <div className="bg-surface rounded-xl shadow-md p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}