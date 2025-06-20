import { createClient } from '../utils/supabase/server';
import AuthButton from './AuthButton';
import Link from 'next/link';
import { type Notification } from './NotificationBell';
import SearchBar from './SearchBar'; // Import the new component

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userProfile = null;
  let notifications: Notification[] = [];

  if (user) {
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
            <Link href="/" className="text-3xl font-bold text-brand flex-shrink-0">
              MarketHub
            </Link>
            {/* The interactive SearchBar is now here */}
            <SearchBar />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-6 text-sm">
                <Link href="/about" className="font-semibold text-text-secondary hover:text-brand transition-colors">About Us</Link>
                <Link href="/how-it-works" className="font-semibold text-text-secondary hover:text-brand transition-colors">How It Works</Link>
            </div>
            <AuthButton user={user} profile={userProfile} notifications={notifications} />
          </div>

        </div>
      </nav>
    </header>
  );
}