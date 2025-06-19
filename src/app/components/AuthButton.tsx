// src/app/components/AuthButton.tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaCoins } from 'react-icons/fa';
import { type User } from '@supabase/supabase-js';
import { createClient } from '../utils/supabase/client';

interface AuthButtonProps {
    user: User | null;
    profile: { credit_balance: number; role: string | null; } | null;
}

export default function AuthButton({ user, profile }: AuthButtonProps) {
  const router = useRouter();
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  if (!user || !profile) {
    return (
      <Link href="/auth" className="px-6 py-2 border-2 border-brand text-brand font-semibold rounded-lg hover:bg-brand hover:text-white transition-all">
        Sign In
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {profile.role === 'admin' && (
        <Link href="/admin/users" className="font-semibold text-red-500 hover:text-red-700 hidden lg:block">Admin</Link>
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