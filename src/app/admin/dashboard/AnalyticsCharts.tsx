'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  dates: string[];
  signups: number[];
  listings: number[];
  orders: number[];
}

interface AnalyticsChartsProps {
  analytics: AnalyticsData;
}

export default function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  const chartData = analytics.dates.map((date, index) => ({
    name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    "New Users": analytics.signups[index],
    "New Listings": analytics.listings[index],
    "Sales": analytics.orders[index],
  }));

  return (
    <div className="space-y-8 mt-8">
      <div>
        <h3 className="text-xl font-semibold mb-4 text-text-primary">Last 30 Days Activity</h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              width={500}
              height={300}
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="New Users" fill="#8884d8" />
              <Bar dataKey="New Listings" fill="#82ca9d" />
              <Bar dataKey="Sales" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}