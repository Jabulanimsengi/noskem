'use client';

import { createClient } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { type User } from '@supabase/supabase-js';
import Link from 'next/link'; // <-- Import Link

// The 'user' prop is passed from a Server Component
export default function AuthButton({ user }: { user: User | null }) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleSignIn = () => {
    router.push('/auth');
  };

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-300">Hey, {user.email}</span>
      {/* ADD THIS NEW LINK */}
      <Link
        href="/items/new"
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        List an Item
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