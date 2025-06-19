import { createClient } from '../utils/supabase/server';
import AuthButton from './AuthButton';
import Link from 'next/link';
import { FaSearch, FaComments } from 'react-icons/fa';
import NotificationBell from './NotificationBell';
import { type Notification } from './NotificationBell'; // Make sure to import the Notification type

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
          <div className="flex items-center gap-4">
            {user && (
              <>
                {/* Chat Icon now links to the main chat history page */}
                <Link href="/chat" className="text-gray-500 hover:text-brand" title="My Chats">
                    <FaComments size={22} />
                </Link>
                
                {/* Notification Bell receives server-fetched notifications */}
                <NotificationBell serverNotifications={notifications} />
              </>
            )}
            
            {/* AuthButton handles sign-in/out and user-specific links */}
            <AuthButton user={user} profile={userProfile} />
          </div>
        </div>
      </nav>
    </header>
  );
}