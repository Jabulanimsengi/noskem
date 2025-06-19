// src/app/components/Header.tsx
import { createClient } from '../utils/supabase/server';
import AuthButton from './AuthButton';
import Link from 'next/link';
import { FaSearch } from 'react-icons/fa';

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let userProfile = null;
  if (user) {
    const { data: profileData } = await supabase.from('profiles').select('credit_balance, role').eq('id', user.id).single();
    userProfile = profileData;
  }

  return (
    <header className="bg-surface shadow-md sticky top-0 z-50">
      <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link href="/" className="text-3xl font-bold text-brand">
              MarketHub
            </Link>
          </div>
          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <input
                type="text"
                className="w-full px-5 py-3 border-2 border-brand rounded-full outline-none focus:ring-2 focus:ring-brand-light bg-background"
                placeholder="Search for anything..."
              />
              <FaSearch className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center">
            <AuthButton user={user} profile={userProfile} />
          </div>
        </div>
      </nav>
    </header>
  );
}