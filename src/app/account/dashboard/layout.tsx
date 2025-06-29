'use client';

import { type ReactNode } from 'react';
import DashboardNav from './DashboardNav';
import { usePathname } from 'next/navigation';
import PageHeader from '@/app/components/PageHeader';

// This helper function correctly gets the title for each page.
const getTitleFromPathname = (pathname: string): string => {
    if (pathname.endsWith('/orders')) return 'My Orders';
    if (pathname.endsWith('/my-listings')) return 'My Listings';
    if (pathname.endsWith('/transactions')) return 'My Transactions';
    if (pathname.endsWith('/offers')) return 'My Offers';
    if (pathname.endsWith('/liked')) return 'My Liked Items';
    if (pathname.endsWith('/notifications')) return 'Notifications';
    if (pathname.endsWith('/profile')) return 'Edit Profile';
    return 'Dashboard';
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = getTitleFromPathname(pathname);

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <DashboardNav />
        </div>
        <div className="md:col-span-3">
          {/* This single PageHeader will now correctly display the title for every page */}
          <PageHeader title={title} />
          <div className="bg-surface p-6 rounded-lg shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}