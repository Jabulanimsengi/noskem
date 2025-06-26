'use client'; // This also needs to be a client component

import { type ReactNode } from 'react';
import AdminNav from '../AdminNav';
import { usePathname } from 'next/navigation';
import PageHeader from '@/app/components/PageHeader'; // Import the new component

// Helper function to get a title from the current URL path
const getTitleFromPathname = (pathname: string): string => {
    if (pathname.endsWith('/users')) return 'User Management';
    if (pathname.endsWith('/transactions')) return 'Financial Transactions';
    if (pathname.endsWith('/items')) return 'All Items';
    if (pathname.endsWith('/offers')) return 'All Offers';
    if (pathname.endsWith('/orders')) return 'All Orders';
    if (pathname.endsWith('/ratings')) return 'All Ratings';
    if (pathname.endsWith('/inspections')) return 'Inspection Reports';
    if (pathname.endsWith('/unconfirmed-users')) return 'Unconfirmed Users';
    return 'Admin Dashboard';
};

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = getTitleFromPathname(pathname);

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
                <AdminNav />
            </div>
            <div className="md:col-span-3">
                {/* FIX: Add the new PageHeader component */}
                <PageHeader title={title} />
                <div className="bg-surface p-6 rounded-lg shadow-sm">
                    {children}
                </div>
            </div>
        </div>
    </div>
  );
}