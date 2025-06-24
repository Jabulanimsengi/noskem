import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardNav from './DashboardNav';
// FIX: Import the BackButton component
import BackButton from '@/app/components/BackButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/?authModal=true');
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* FIX: Add the BackButton component here */}
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary">My Dashboard</h1>
        <p className="mt-1 text-lg text-text-secondary">Manage your orders, notifications, and profile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <DashboardNav />
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