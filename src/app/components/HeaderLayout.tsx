// src/app/components/HeaderLayout.tsx

import { createClient } from '@/utils/supabase/server';
import Header from './Header';
import { type Profile } from '@/types';

export default async function HeaderLayout() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
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
    likesCount = count ?? 0;
  }

  return <Header user={user} profile={profile} initialLikesCount={likesCount} />;
}