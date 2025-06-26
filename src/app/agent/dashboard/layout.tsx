import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AgentDashboardLayout({
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

  // Ensure only users with the 'agent' role can access this section
  if (profile?.role !== 'agent') {
    return (
        <div className="container mx-auto text-center p-12">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-text-secondary mt-2">You do not have permission to view the agent panel.</p>
        </div>
    );
  }

  return (
    // This container constrains the width and centers the content
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="bg-surface rounded-xl shadow-md p-6">
        {children}
      </div>
    </div>
  );
}