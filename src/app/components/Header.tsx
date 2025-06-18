// File: app/components/Header.tsx

import { createClient } from '../utils/supabase/server';
import AuthButton from './AuthButton';
import Link from 'next/link';
import NotificationBell, { type Notification } from './NotificationBell'; // Import the new component

type Profile = {
    username: string | null;
    credit_balance: number;
    role: string | null;
};

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userProfile: Profile | null = null;
  let initialNotifications: Notification[] = [];

  // If a user is logged in, fetch their profile and their notifications
  if (user) {
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, credit_balance, role')
      .eq('id', user.id)
      .single();
    userProfile = profileData;

    // Fetch notifications
    const { data: notificationData } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10); // Get the 10 most recent notifications
    initialNotifications = notificationData || [];
  }

  return (
    <nav className="w-full border-b border-gray-700 bg-gray-800 sticky top-0 z-50">
      <div className="container flex items-center justify-between p-4 mx-auto">
        <Link href="/" className="text-xl font-bold text-white">
          Marketplace
        </Link>
        
        <div className="flex items-center gap-2">
            {/* If the user is logged in, show the Notification Bell */}
            {user && <NotificationBell serverNotifications={initialNotifications} />}
            <AuthButton user={user} profile={userProfile} />
        </div>
      </div>
    </nav>
  );
}