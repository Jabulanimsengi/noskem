'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaBars, FaPlusCircle } from 'react-icons/fa';
import { MessageSquare } from 'lucide-react';
import { type User } from '@supabase/supabase-js';
import { type Notification } from './NotificationBell';
import SearchBar from './SearchBar';
import AuthButton from './AuthButton';
import MobileMenu from './MobileMenu';
import NotificationBell from './NotificationBell';

interface HeaderLayoutProps {
    user: User | null;
    profile: {
        credit_balance: number;
        role: string | null;
        username: string | null;
        avatar_url: string | null;
    } | null;
    notifications: Notification[];
}

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
            
            {user ? (
              <div className="flex items-center gap-5 ml-6">
                {/* FIX: Changed this link to a prominent button style */}
                <Link 
                  href="/items/new" 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors shadow" 
                  title="Sell an Item"
                >
                  <FaPlusCircle size={18} />
                  <span>Sell Item</span>
                </Link>

                <Link href="/chat" title="Messages" className="text-gray-500 hover:text-brand">
                  <MessageSquare size={22} />
                </Link>
                <NotificationBell serverNotifications={notifications} />
                <div className="h-8 border-l border-gray-300"></div>
                <AuthButton user={user} profile={profile} />
              </div>
            ) : (
              <div className="ml-4">
                 <AuthButton user={user} profile={profile} />
              </div>
            )}
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