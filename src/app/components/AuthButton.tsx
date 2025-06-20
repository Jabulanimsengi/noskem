'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaCoins } from 'react-icons/fa';
import { type User } from '@supabase/supabase-js';
import { createClient } from '../utils/supabase/client';
import { useAuthModal } from '@/context/AuthModalContext'; // Import the hook

interface AuthButtonProps {
    user: User | null;
    profile: { credit_balance: number; role: string | null; } | null;
}

export default function AuthButton({ user, profile }: AuthButtonProps) {
  const router = useRouter();
  const { openModal } = useAuthModal(); // Get the function from context
  
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => openModal('signIn')} className="px-4 py-2 text-sm font-semibold text-brand border border-brand rounded-lg hover:bg-brand/10 transition-colors">
          Sign In
        </button>
        <button onClick={() => openModal('signUp')} className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors shadow-sm">
          Sign Up
        </button>
      </div>
    );
  }

  // Logged-in view remains the same
  return (
    <div className="flex items-center gap-4">
      {profile.role === 'admin' && (
        <Link href="/admin/users" className="font-semibold text-red-500 hover:text-red-700 hidden lg:block">Admin</Link>
      )}
       {profile.role === 'agent' && (
        <Link href="/agent/dashboard" className="font-semibold text-text-primary hover:text-brand hidden lg:block">Agent</Link>
      )}
      <Link href="/credits/buy" className="font-semibold text-brand hover:text-brand-dark flex items-center gap-2">
        <FaCoins /> {profile.credit_balance}
      </Link>
      <Link href="/account/dashboard/orders" className="font-semibold text-text-primary hover:text-brand hidden md:block">My Dashboard</Link>
      <button onClick={handleSignOut} className="font-semibold text-text-primary hover:text-brand hidden md:block">Sign Out</button>
      <Link href="/items/new" className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-all shadow-md hover:shadow-lg">
        Sell
      </Link>
    </div>
  );
}