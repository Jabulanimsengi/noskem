import { createClient } from '../utils/supabase/server';
import HeaderLayout from './HeaderLayout';

export default async function Header() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  let likesCount = 0;

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = profileData;

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    likesCount = count || 0;
  }
  
  return <HeaderLayout user={user} profile={profile} likesCount={likesCount} />;
}