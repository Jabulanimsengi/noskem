'use client';

import { createClient } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import Link from 'next/link';
import Avatar from './Avatar';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';

interface AuthButtonProps {
  user: User | null;
  profile: {
    credit_balance: number;
    role: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export default function AuthButton({ user, profile }: AuthButtonProps) {
  const router = useRouter();
  const { openModal } = useAuthModal();
  const { showConfirmation } = useConfirmationModal();
  const supabase = createClient();

  const handleSignOut = () => {
    showConfirmation({
        title: 'Confirm Sign Out',
        message: 'Are you sure you want to sign out?',
        onConfirm: async () => {
            await supabase.auth.signOut();
            router.push('/'); // Force a full reload to clear all state
        }
    });
  };

  return user ? (
    <div className="flex items-center gap-4">
      <Link href="/items/new" className="hidden sm:inline-block px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
        List an Item
      </Link>
      <div className="relative group">
        <Link href="/account/dashboard">
          <Avatar src={profile?.avatar_url} alt={profile?.username || 'U'} size={40} />
        </Link>
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-700">
              <p className="font-semibold">{profile?.username || user.email}</p>
              <p className="text-xs text-gray-500">Credits: {profile?.credit_balance ?? 0}</p>
            </div>
            <div className="border-t border-gray-100"></div>
            <Link href="/account/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Dashboard</Link>
            <Link href="/account/dashboard/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Orders</Link>
            {profile?.role === 'admin' && <Link href="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Panel</Link>}
            <div className="border-t border-gray-100"></div>
            <button
              onClick={handleSignOut}
              className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      {/* FIX: Use 'sign_in' and 'sign_up' */}
      <button onClick={() => openModal('sign_in')} className="px-4 py-2 text-sm font-semibold text-text-primary hover:bg-gray-100 rounded-md">
        Sign In
      </button>
      <button onClick={() => openModal('sign_up')} className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark">
        Sign Up
      </button>
    </div>
  );
}