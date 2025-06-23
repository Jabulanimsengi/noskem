import { createClient } from "@/app/utils/supabase/server";
import AnalyticsCharts from "./AnalyticsCharts"; // Import the new component

type DashboardStats = {
  userCount: number | null;
  itemCount: number | null;
  orderCount: number | null;
  offerCount: number | null;
};

// Define the type for the analytics data from our new function
type AnalyticsData = {
  dates: string[];
  signups: number[];
  listings: number[];
  orders: number[];
};

const StatCard = ({ title, value }: { title: string; value: number | string }) => (
  <div className="bg-gray-50 p-4 rounded-lg border">
    <p className="text-sm text-text-secondary">{title}</p>
    <p className="text-3xl font-bold text-text-primary">{value ?? 0}</p>
  </div>
);

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch all stats and analytics data in parallel
  const [
    { count: userCount },
    { count: itemCount },
    { count: orderCount },
    { count: offerCount },
    { data: analyticsData, error: analyticsError }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('items').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('offers').select('*', { count: 'exact', head: true }),
    supabase.rpc('get_dashboard_analytics') // Call our new database function
  ]);

  if (analyticsError) {
    console.error("Error fetching analytics:", analyticsError);
  }

  const stats: DashboardStats = { userCount, itemCount, orderCount, offerCount };
  const analytics = analyticsData as AnalyticsData;

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Marketplace Overview</h2>
      
      {/* Existing Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.userCount ?? 0} />
        <StatCard title="Total Items" value={stats.itemCount ?? 0} />
        <StatCard title="Total Orders" value={stats.orderCount ?? 0} />
        <StatCard title="Total Offers" value={stats.offerCount ?? 0} />
      </div>

      {/* New Analytics Chart Section */}
      {analytics ? (
        <AnalyticsCharts analytics={analytics} />
      ) : (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
            <p className="text-text-secondary">Analytics data is being generated. Please check back shortly.</p>
        </div>
      )}
    </div>
  );
}