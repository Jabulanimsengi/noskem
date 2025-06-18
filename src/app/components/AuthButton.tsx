// File: app/components/AuthButton.tsx

'use client';

import { createClient } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { type User } from '@supabase/supabase-js';
import Link from 'next/link';
import { FaCoins } from 'react-icons/fa'; // Import the icon

// The component now accepts the user's profile data as a prop
interface AuthButtonProps {
    user: User | null;
    profile: {
        username: string | null;
        credit_balance: number;
    } | null;
}

export default function AuthButton({ user, profile }: AuthButtonProps) {
  const router = useRouter();
  
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleSignIn = () => {
    router.push('/auth');
  };

  return user && profile ? (
    <div className="flex items-center gap-4">
      {/* --- NEW CREDIT BALANCE DISPLAY --- */}
      <Link href="/credits/buy" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-300 bg-gray-700 rounded-md hover:bg-gray-600">
        <FaCoins />
        <span>{profile.credit_balance} Credits</span>
      </Link>
      
      <Link
        href="/account/orders"
        className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 hidden sm:block"
      >
        My Orders
      </Link>

      <Link
        href="/items/new"
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        List Item
      </Link>

      <button
        onClick={handleSignOut}
        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
      >
        Sign Out
      </button>
    </div>
  ) : (
    <button
      onClick={handleSignIn}
      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
    >
      Sign In
    </button>
  );
}