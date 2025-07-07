// src/app/admin/dashboard/AnalyticsCharts.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- FIX: Add 'orders' to the expected props ---
interface AnalyticsChartsProps {
  analytics: {
    dates: string[];
    signups: number[];
    listings: number[];
    orders: number[]; // <-- Added this line
  };
}

export default function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  // Add a check to ensure analytics and analytics.dates exist before mapping.
  if (!analytics || !analytics.dates || analytics.dates.length === 0) {
    return <div className="text-center p-8 text-gray-500">No analytics data available for this period.</div>;
  }

  // --- FIX: Add 'New Orders' to the chart data ---
  const chartData = analytics.dates.map((date, index) => ({
    name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    "New Users": analytics.signups[index] || 0,
    "New Listings": analytics.listings[index] || 0,
    "New Orders": analytics.orders[index] || 0, // <-- Added this line
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Last 30 Days Activity</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
          />
          <Legend />
          <Bar dataKey="New Users" fill="#8884d8" name="New Users" />
          <Bar dataKey="New Listings" fill="#82ca9d" name="New Listings" />
          {/* --- FIX: Add the new bar for orders --- */}
          <Bar dataKey="New Orders" fill="#ffc658" name="Completed Orders" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}