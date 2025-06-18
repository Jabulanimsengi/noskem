// File: app/components/Header.tsx

import { createClient } from '../utils/supabase/server';
import AuthButton from './AuthButton';
import Link from 'next/link';

// Define the shape of the profile data we need
type Profile = {
    username: string | null;
    credit_balance: number;
    role: string | null;
};

export default async function Header() {
  const supabase = await createClient();

  // First, get the user from the current session
  const { data: { user } } = await supabase.auth.getUser();

  let userProfile: Profile | null = null;

  // ONLY if a user exists, then fetch their profile data from the database
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, credit_balance, role')
      .eq('id', user.id)
      .single();
    
    userProfile = profileData;
  }

  return (
    <nav className="w-full border-b border-gray-700 bg-gray-800 sticky top-0 z-50">
      <div className="container flex items-center justify-between p-4 mx-auto">
        <Link href="/" className="text-xl font-bold text-white">
          Marketplace
        </Link>
        
        {/* Pass both the user object and the fetched profile object */}
        <AuthButton user={user} profile={userProfile} />
      </div>
    </nav>
  );
}