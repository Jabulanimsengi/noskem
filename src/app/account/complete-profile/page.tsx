import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import CompleteProfileForm from './CompleteProfileForm';

// This is a protected server component.
export default async function CompleteProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // If not logged in, send to login page.
    return redirect('/?authModal=sign_in');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  // If the user's profile is already complete (they have a username),
  // they don't belong here. Send them to their dashboard.
  if (profile?.username) {
    redirect('/account/dashboard');
  }

  // Otherwise, render the form for them to complete.
  return <CompleteProfileForm />;
}