import { createClient } from '../utils/supabase/server';
import HeaderLayout from './HeaderLayout';

// FIX: This is now an async Server Component. It has no 'use client' directive.
export default async function Header() {
  const supabase = await createClient();
  
  // It fetches user and profile data directly on the server.
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = profileData;
  }
  
  // It passes the data as props to the client component responsible for the UI.
  return <HeaderLayout user={user} profile={profile} />;
}