'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { type Profile } from '@/types'; // Assuming you have a Profile type

export interface CompleteProfileState {
  error: string | null;
  success: boolean;
}

export async function completeProfileAction(
  prevState: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to update your profile.', success: false };
  }

  const username = formData.get('username') as string;
  const accountType = formData.get('accountType') as 'individual' | 'business';

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .not('id', 'eq', user.id)
    .single();

  if (existingProfile) {
    return { error: 'This username is already taken. Please choose another.', success: false };
  }

  const profileData: Partial<Profile> = {
    username,
    account_type: accountType,
    updated_at: new Date().toISOString(),
  };

  if (accountType === 'individual') {
    profileData.first_name = formData.get('firstName') as string;
    profileData.last_name = formData.get('lastName') as string;
  } else {
    profileData.company_name = formData.get('companyName') as string;
    profileData.company_registration = formData.get('companyRegistration') as string | null;
  }

  const { error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', user.id);

  if (error) {
    return { error: `Failed to update profile: ${error.message}`, success: false };
  }

  revalidatePath('/', 'layout');
  redirect('/account/dashboard');
}