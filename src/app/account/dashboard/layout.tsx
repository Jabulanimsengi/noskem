// File: app/account/dashboard/layout.tsx

import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardNav from './DashboardNav'; // We will create this component next

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-white mb-6">My Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <aside className="md:col-span-1">
          <DashboardNav />
        </aside>

        {/* Main Content Area */}
        <main className="md:col-span-3">
          {children}
        </main>
      </div>
    </div>
  );
}