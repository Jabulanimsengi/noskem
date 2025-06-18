// File: app/components/Header.tsx

import { createClient } from '../utils/supabase/server'; // Correct path
import AuthButton from './AuthButton';
import Link from 'next/link';
import { FaCoins } from 'react-icons/fa'; // We will install this icon library next

export default async function Header() {
  const supabase = await createClient();

  // Fetch the current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userProfile = null;
  if (user) {
    // If a user is logged in, fetch their profile data, including the credit balance
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, credit_balance')
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
        
        {/* Pass both the user and their profile to the AuthButton component */}
        <AuthButton user={user} profile={userProfile} />
      </div>
    </nav>
  );
}