// File: app/account/dashboard/profile/actions.ts

'use server';

import { createClient } from '../../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Define the shape of our form's state
export interface UpdateProfileState {
  message: string;
  type: 'success' | 'error' | null;
}

// --- THIS IS THE FIX ---
// We explicitly define that the function will always return a Promise
// that resolves to our UpdateProfileState type.
export async function updateUserProfile(
  prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> { // Add the return type here
  const supabase = await createClient();

  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'Authentication failed. Please log in again.', type: 'error' };
  }

  // 2. Get the data from the form
  const username = formData.get('username') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const companyName = formData.get('companyName') as string;

  // 3. Construct the object with the data to be updated
  const profileData = {
    username,
    first_name: firstName,
    last_name: lastName,
    company_name: companyName,
    updated_at: new Date().toISOString(),
  };

  // 4. Update the user's record in the 'profiles' table
  const { error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', user.id);

  if (error) {
    if (error.code === '23505') { // 'unique_violation'
        return { message: 'This username is already taken. Please choose another.', type: 'error' };
    }
    console.error('Error updating profile:', error);
    return { message: 'Failed to update your profile.', type: 'error' };
  }

  // 5. Revalidate paths to show the new data everywhere
  revalidatePath('/', 'layout');

  return { message: 'Profile updated successfully!', type: 'success' };
}