// src/app/components/HeaderLayout.tsx

import { createClient } from '@/utils/supabase/server';
import Header from './Header';
import { type Profile } from '@/types';

export default async function HeaderLayout() { // FIX: Marked as async
  const supabase = await createClient(); // FIX: Added await
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let likesCount = 0; // Default likes count to 0

  if (user) {
    // Fetch the user's profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = profileData;

    // --- FIX IS HERE ---
    // Fetch the count of the user's liked items
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
      
    likesCount = count ?? 0;
  }

  // Pass all the necessary data as props to the Header component
  return <Header user={user} profile={profile} initialLikesCount={likesCount} />;
}