'use client';

import Link from 'next/link';
import { FaTimes, FaCoins, FaShoppingCart } from 'react-icons/fa';
import { type User } from '@supabase/supabase-js';
import SearchBar from './SearchBar';
import { type Notification } from './NotificationBell';
import { useAuthModal } from '@/context/AuthModalContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  profile: { credit_balance: number; role: string | null; } | null;
}

export default function MobileMenu({ isOpen, onClose, user, profile }: MobileMenuProps) {
  const { openModal } = useAuthModal();

  if (!isOpen) {
    return null;
  }

  const handleSignIn = () => {
    onClose();
    // FIX: Changed 'signIn' to 'sign_in' to match the expected value.
    openModal('sign_in');
  };

  const handleSignUp = () => {
    onClose();
    // FIX: Changed 'signUp' to 'sign_up' to match the expected value.
    openModal('sign_up');
  };

  return (
    <div className="fixed inset-0 bg-surface z-50 p-4 flex flex-col lg:hidden">
      <div className="flex justify-between items-center mb-8">
        <Link href="/" onClick={onClose} className="flex items-center gap-2 text-brand">
          <FaShoppingCart className="h-6 w-6" />
          <span className="text-2xl font-extrabold tracking-tight">NOSKEM</span>
        </Link>
        <button onClick={onClose} className="p-2">
          <FaTimes className="h-6 w-6 text-text-secondary" />
        </button>
      </div>

      <div className="mb-6">
        <SearchBar />
      </div>

      <nav className="flex flex-col gap-4 text-lg font-semibold text-text-primary">
        <Link href="/about" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">About Us</Link>
        <Link href="/how-it-works" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">How It Works</Link>
        
        {user && profile && (
            <>
                <hr/>
                <Link href="/account/dashboard/orders" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">My Dashboard</Link>
                <Link href="/credits/buy" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md flex items-center gap-2">
                    Credits <span className="font-bold text-brand">{profile.credit_balance}</span>
                </Link>
                {profile.role === 'admin' && <Link href="/admin/users" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">Admin</Link>}
                {profile.role === 'agent' && <Link href="/agent/dashboard" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">Agent</Link>}
            </>
        )}
      </nav>

      <div className="mt-auto border-t pt-6">
        {!user ? (
            <div className="flex gap-4">
                <button onClick={handleSignIn} className="flex-1 px-4 py-3 text-sm font-semibold text-brand border border-brand rounded-lg">Sign In</button>
                <button onClick={handleSignUp} className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-brand rounded-lg">Sign Up</button>
            </div>
        ) : (
             <Link href="/items/new" onClick={onClose} className="w-full block text-center px-6 py-3 bg-brand text-white font-semibold rounded-lg">
                Sell an Item
            </Link>
        )}
      </div>
    </div>
  );
}