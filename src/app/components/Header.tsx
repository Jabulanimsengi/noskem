import { createClient } from '../utils/supabase/server';
import { type Notification } from './NotificationBell';
import HeaderLayout from './HeaderLayout';

// FIX: This Server Component fetches all necessary data for the header.
export default async function Header() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  let userProfile = null;
  let notifications: Notification[] = [];

  if (user) {
    // Fetch profile and notifications concurrently for performance
    const [profileRes, notificationsRes] = await Promise.all([
      supabase.from('profiles').select('credit_balance, role, avatar_url, username').eq('id', user.id).single(),
      supabase.from('notifications').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(20)
    ]);

    userProfile = profileRes.data;
    notifications = (notificationsRes.data as Notification[]) || [];
  }

  // It then passes this server-fetched data as props to the client component for rendering.
  return <HeaderLayout user={user} profile={userProfile} notifications={notifications} />;
}