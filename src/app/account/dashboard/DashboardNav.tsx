'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// FIX: Import a new icon for the transactions link
import { FaBoxOpen, FaBell, FaUserCircle, FaGavel, FaThList, FaReceipt } from 'react-icons/fa';

const navLinks = [
  { name: 'My Orders', href: '/account/dashboard/orders', icon: FaBoxOpen },
  { name: 'My Listings', href: '/account/dashboard/my-listings', icon: FaThList },
  // FIX: Add the new "Transactions" link
  { name: 'Transactions', href: '/account/dashboard/transactions', icon: FaReceipt },
  { name: 'My Offers', href: '/account/dashboard/offers', icon: FaGavel },
  { name: 'Notifications', href: '/account/dashboard/notifications', icon: FaBell },
  { name: 'Profile', href: '/account/dashboard/profile', icon: FaUserCircle },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navLinks.map((link) => {
        const isActive = pathname.startsWith(link.href); 
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-150 ease-in-out
              ${
                isActive
                  ? 'bg-brand text-white shadow-md'
                  : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
              }`}
          >
            <link.icon
              className={`h-5 w-5 flex-shrink-0 transition-all duration-150 ease-in-out
                ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-brand'
                }`}
            />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}