'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FaUsers, FaTachometerAlt, FaBoxOpen, FaGavel, FaCreditCard, 
  FaStar, FaUserClock, FaClipboardCheck, FaMoneyBillWave, FaIdCard, 
  FaExclamationTriangle, FaConciergeBell // New Icon
} from 'react-icons/fa';

const navLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: FaTachometerAlt },
  { name: 'User Management', href: '/admin/users', icon: FaUsers },
  { name: 'ID Verifications', href: '/admin/verifications', icon: FaIdCard },
  // --- NEW LINK ADDED HERE ---
  { name: 'Service Applications', href: '/admin/services', icon: FaConciergeBell },
  { name: 'Disputes', href: '/admin/disputes', icon: FaExclamationTriangle }, 
  { name: 'Transactions', href: '/admin/transactions', icon: FaMoneyBillWave },
  { name: 'All Items', href: '/admin/items', icon: FaBoxOpen },
  { name: 'All Offers', href: '/admin/offers', icon: FaGavel },
  { name: 'All Orders', href: '/admin/orders', icon: FaCreditCard },
  { name: 'All Ratings', href: '/admin/ratings', icon: FaStar },
  { name: 'Inspection Reports', href: '/admin/inspections', icon: FaClipboardCheck },
  { name: 'Unconfirmed Users', href: '/admin/unconfirmed-users', icon: FaUserClock },
];

export default function AdminNav() {
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