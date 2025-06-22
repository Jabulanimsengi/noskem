import { createClient } from "@/app/utils/supabase/server";

// Define a type for the stats for clarity
type DashboardStats = {
  userCount: number | null;
  itemCount: number | null;
  orderCount: number | null;
  offerCount: number | null;
};

// A simple component to display a stat card
const StatCard = ({ title, value }: { title: string; value: number | string }) => (
  <div className="bg-gray-50 p-4 rounded-lg border">
    <p className="text-sm text-text-secondary">{title}</p>
    <p className="text-3xl font-bold text-text-primary">{value}</p>
  </div>
);

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch all stats in parallel for better performance
  const [
    { count: userCount },
    { count: itemCount },
    { count: orderCount },
    { count: offerCount }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('items').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('offers').select('*', { count: 'exact', head: true }),
  ]);

  const stats: DashboardStats = {
    userCount,
    itemCount,
    orderCount,
    offerCount
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Marketplace Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.userCount ?? 0} />
        <StatCard title="Total Items" value={stats.itemCount ?? 0} />
        <StatCard title="Total Orders" value={stats.orderCount ?? 0} />
        <StatCard title="Total Offers" value={stats.offerCount ?? 0} />
      </div>
      <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
        <h3 className="text-xl font-semibold">Welcome, Admin!</h3>
        <p className="text-text-secondary mt-1">More analytics and reporting tools will be added here soon.</p>
      </div>
    </div>
  );
}