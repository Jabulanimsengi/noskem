'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaCoins, FaComments } from 'react-icons/fa';
import { type User } from '@supabase/supabase-js';
import { createClient } from '../utils/supabase/client';
import { useAuthModal } from '@/context/AuthModalContext';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';
import NotificationBell, { type Notification } from './NotificationBell';

interface AuthButtonProps {
    user: User | null;
    profile: { credit_balance: number; role: string | null; } | null;
    notifications: Notification[];
}

export default function AuthButton({ user, profile, notifications }: AuthButtonProps) {
  const router = useRouter();
  const { openModal } = useAuthModal();
  const { showConfirmation } = useConfirmationModal();

  const performSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    sessionStorage.setItem('pendingToast', JSON.stringify({ message: "You have been logged out successfully.", type: 'info' }));
    router.refresh();
  };

  const handleSignOut = () => {
    showConfirmation({
        title: "Confirm Sign Out",
        message: "Are you sure you want to sign out of your account?",
        confirmText: "Sign Out",
        onConfirm: performSignOut,
    });
  };

  // Logged-out view
  if (!user || !profile) {
    return (
      <div className="flex items-center gap-2">
        <button 
          onClick={() => openModal('signIn')} 
          className="px-4 py-2 text-sm font-semibold text-brand border border-brand rounded-lg hover:bg-brand/10 transition-colors"
        >
          Sign In
        </button>
        <button 
          onClick={() => openModal('signUp')} 
          className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors shadow-sm"
        >
          Sign Up
        </button>
      </div>
    );
  }

  // Logged-in view: All user actions are now in a single flex container for consistent spacing and alignment
  return (
    <div className="flex items-center gap-2 md:gap-4">
      {/* Chat and Notifications */}
      <Link href="/chat" className="text-gray-500 hover:text-brand p-2" title="My Chats">
          <FaComments size={22} />
      </Link>
      <NotificationBell serverNotifications={notifications} />

      <div className="h-6 w-px bg-gray-200 hidden md:block" />

      {/* Role-specific Links */}
      {profile.role === 'admin' && (
        <Link href="/admin/users" className="font-semibold text-red-500 hover:text-red-700 hidden lg:block">Admin</Link>
      )}
       {profile.role === 'agent' && (
        <Link href="/agent/dashboard" className="font-semibold text-text-primary hover:text-brand hidden lg:block">Agent</Link>
      )}

      {/* User Links */}
      <Link href="/credits/buy" className="font-semibold text-brand hover:text-brand-dark flex items-center gap-2 p-2">
        <FaCoins />
        <span>{profile.credit_balance}</span>
      </Link>
      <Link href="/account/dashboard/orders" className="font-semibold text-text-primary hover:text-brand hidden md:block">My Dashboard</Link>
      <button onClick={handleSignOut} className="font-semibold text-text-primary hover:text-brand hidden md:block">Sign Out</button>

      <div className="h-6 w-px bg-gray-200 hidden md:block" />

      {/* Primary Action Button */}
      <Link href="/items/new" className="px-4 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-all shadow-sm">
        Sell
      </Link>
    </div>
  );
}