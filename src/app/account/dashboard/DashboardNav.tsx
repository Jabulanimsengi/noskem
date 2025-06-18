// File: app/account/dashboard/DashboardNav.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBoxOpen, FaBell, FaUserCircle } from 'react-icons/fa';

const navLinks = [
  { name: 'My Orders', href: '/account/dashboard/orders', icon: FaBoxOpen },
  { name: 'Notifications', href: '/account/dashboard/notifications', icon: FaBell },
  { name: 'Profile', href: '/account/dashboard/profile', icon: FaUserCircle },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-800 rounded-lg p-4">
      <ul className="space-y-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.name}>
              <Link
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <link.icon className="h-5 w-5" />
                <span>{link.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}