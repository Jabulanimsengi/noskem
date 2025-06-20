import { createClient } from '../utils/supabase/server';
import AuthButton from './AuthButton';
import Link from 'next/link';
import { FaSearch } from 'react-icons/fa';
import { type Notification } from './NotificationBell';

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userProfile = null;
  let notifications: Notification[] = [];

  if (user) {
    // Fetch profile and notifications at the same time for better performance
    const [profileRes, notificationsRes] = await Promise.all([
      supabase.from('profiles').select('credit_balance, role').eq('id', user.id).single(),
      supabase.from('notifications').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(10)
    ]);

    userProfile = profileRes.data;
    notifications = (notificationsRes.data as Notification[]) || [];
  }

  return (
    <header className="bg-surface shadow-md sticky top-0 z-50">
      <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          <div className="flex items-center gap-8">
            <Link href="/" className="text-3xl font-bold text-brand">
              MarketHub
            </Link>
            <div className="flex-1 max-w-xl hidden lg:block">
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-brand bg-background"
                  placeholder="Search for anything..."
                />
                <FaSearch className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* The new AuthButton now handles all user actions and notifications */}
            <AuthButton user={user} profile={userProfile} notifications={notifications} />
          </div>

        </div>
      </nav>
    </header>
  );
}