// src/app/admin/dashboard/page.tsx

import { createClient } from '@/utils/supabase/server';
import { Suspense } from 'react';
import DynamicAnalyticsCharts from './DynamicAnalyticsCharts';
import { notFound } from 'next/navigation';

// This function generates the time-series data for the charts
async function getAnalyticsData() {
  const supabase = createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // --- FIX: Fetch completed orders along with signups and listings ---
  const [signupsRes, listingsRes, ordersRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('items')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    // Add this query to get completed orders
    supabase
      .from('orders')
      .select('created_at')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString()),
  ]);

  if (signupsRes.error || listingsRes.error || ordersRes.error) {
    console.error('Error fetching analytics:', signupsRes.error || listingsRes.error || ordersRes.error);
    // Return a default structure to prevent crashes
    return { dates: [], signups: [], listings: [], orders: [] };
  }

  const signupsByDate: { [key: string]: number } = {};
  const listingsByDate: { [key: string]: number } = {};
  // --- FIX: Add a map for orders data ---
  const ordersByDate: { [key: string]: number } = {};

  // Group data by date
  (signupsRes.data || []).forEach(profile => {
    const date = new Date(profile.created_at).toISOString().split('T')[0];
    signupsByDate[date] = (signupsByDate[date] || 0) + 1;
  });

  (listingsRes.data || []).forEach(item => {
    const date = new Date(item.created_at).toISOString().split('T')[0];
    listingsByDate[date] = (listingsByDate[date] || 0) + 1;
  });

  // --- FIX: Group orders data by date ---
  (ordersRes.data || []).forEach(order => {
    const date = new Date(order.created_at).toISOString().split('T')[0];
    ordersByDate[date] = (ordersByDate[date] || 0) + 1;
  });

  const dates: string[] = [];
  const signups: number[] = [];
  const listings: number[] = [];
  // --- FIX: Add an array for the final orders count ---
  const orders: number[] = [];

  // Create arrays for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    dates.push(dateString);
    signups.push(signupsByDate[dateString] || 0);
    listings.push(listingsByDate[dateString] || 0);
    // --- FIX: Populate the orders array ---
    orders.push(ordersByDate[dateString] || 0);
  }

  // --- FIX: Return the orders data ---
  return { dates, signups, listings, orders };
}

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return notFound();
  }

  const analyticsData = await getAnalyticsData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-text-secondary">Overview of marketplace activity.</p>
      </div>
      
      <Suspense fallback={<div className="text-center p-8">Loading analytics...</div>}>
        <DynamicAnalyticsCharts analytics={analyticsData} />
      </Suspense>
    </div>
  );
}