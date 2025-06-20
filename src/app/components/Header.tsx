import { createClient } from '../utils/supabase/server';
import { type Notification } from './NotificationBell';
import HeaderLayout from './HeaderLayout';

// This is now a clean Server Component that only fetches data
export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userProfile = null;
  let notifications: Notification[] = [];

  if (user) {
    // Fetch profile and notifications in parallel for better performance
    const [profileRes, notificationsRes] = await Promise.all([
      supabase.from('profiles').select('credit_balance, role').eq('id', user.id).single(),
      supabase.from('notifications').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(10)
    ]);

    userProfile = profileRes.data;
    notifications = (notificationsRes.data as Notification[]) || [];
  }

  // It passes the freshly fetched data to the client component for rendering
  return <HeaderLayout user={user} profile={userProfile} notifications={notifications} />;
}