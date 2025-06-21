'use client';

import { createClient } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/context/AuthModalContext';
import { type User } from '@supabase/supabase-js';
import Link from 'next/link';
import Avatar from './Avatar';

interface AuthButtonProps {
  user: User | null;
  profile: {
    credit_balance: number;
    role: string | null;
  } | null;
}

export default function AuthButton({ user, profile }: AuthButtonProps) {
  const router = useRouter();
  const { openModal } = useAuthModal();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // FIX: Replaced router.refresh() with router.push('/') for a full state refresh.
    router.push('/');
  };

  return user ? (
    <div className="flex items-center gap-4">
      <Link href="/items/new" className="hidden sm:inline-block px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
        List an Item
      </Link>
      <div className="relative group">
        <Link href="/account/dashboard">
          <Avatar src={user.user_metadata.avatar_url} alt={user.user_metadata.username || 'U'} size={40} />
        </Link>
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-700">
              <p className="font-semibold">{user.user_metadata.username || user.email}</p>
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
      <button onClick={() => openModal('signIn')} className="px-4 py-2 text-sm font-semibold text-text-primary hover:bg-gray-100 rounded-md">
        Sign In
      </button>
      <button onClick={() => openModal('signUp')} className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark">
        Sign Up
      </button>
    </div>
  );
}