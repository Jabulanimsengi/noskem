import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import ProfileClient from './ProfileClient';
import { type Profile } from '@/types';

// This is now a Server Component that fetches data.
export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // This should be caught by the layout, but it's good practice
    return redirect('/?authModal=true');
  }

  // Fetch the user's profile on the server
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (!profileData) {
    // This could happen if a user exists in auth but not in profiles
    notFound();
  }
  
  // Fetch the user's MFA factors on the server
  const { data: mfaData } = await supabase.auth.mfa.listFactors();
  const factors = mfaData?.all || [];

  // Render the client component and pass the fetched data as props
  return <ProfileClient profile={profileData as Profile} factors={factors} />;
}