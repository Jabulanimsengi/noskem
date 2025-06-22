'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaBars } from 'react-icons/fa';
import { type User } from '@supabase/supabase-js';
import { type Notification } from './NotificationBell';
import SearchBar from './SearchBar';
import AuthButton from './AuthButton';
import MobileMenu from './MobileMenu';
import NotificationBell from './NotificationBell';

// Define the props this component accepts from its server parent
interface HeaderLayoutProps {
    user: User | null;
    // FIX: The profile type is updated to include all properties passed from the Header.
    // This resolves the TypeScript error.
    profile: {
        credit_balance: number;
        role: string | null;
        username: string | null;
        avatar_url: string | null;
    } | null;
    notifications: Notification[];
}

// This client component manages all the UI and state for the header
export default function HeaderLayout({ user, profile, notifications }: HeaderLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-surface shadow-md sticky top-0 z-40">
      <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-brand hover:text-brand-dark transition-colors">
              <FaShoppingCart className="h-7 w-7" />
              <span className="text-2xl font-extrabold tracking-tight">
                NOSKEM
              </span>
            </Link>
          </div>
          
          <div className="hidden lg:flex flex-1 justify-center px-8">
              <SearchBar />
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-6 text-sm font-semibold text-text-secondary">
                <Link href="/about" className="hover:text-brand transition-colors">About Us</Link>
                <Link href="/how-it-works" className="hover:text-brand transition-colors">How It Works</Link>
            </div>
            
            {user && <NotificationBell serverNotifications={notifications} />}
            <AuthButton user={user} profile={profile} />
          </div>

          <div className="lg:hidden">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2">
                <FaBars className="h-6 w-6 text-text-primary" />
              </button>
          </div>
        </div>
      </nav>

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        profile={profile}
      />
    </header>
  );
}