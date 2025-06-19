// File: app/account/dashboard/profile/actions.ts

'use server';

import { createClient } from '../../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface UpdateProfileState {
  message: string;
  type: 'success' | 'error' | null;
}

export async function updateUserProfile(
  prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'Authentication failed. Please log in again.', type: 'error' };
  }

  // Handle Avatar Upload
  let avatarUrl: string | undefined = undefined;
  const avatarFile = formData.get('avatar') as File;

  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop();
    const filePath = `${user.id}/${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile);

    if (uploadError) {
      console.error('Avatar Upload Error:', uploadError);
      return { message: 'Failed to upload new avatar.', type: 'error' };
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    avatarUrl = publicUrl;
  }

  // Get other form data
  const username = formData.get('username') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const companyName = formData.get('companyName') as string;

  // Construct the object with data to be updated
  const profileData: { [key: string]: any } = {
    username,
    first_name: firstName,
    last_name: lastName,
    company_name: companyName,
    updated_at: new Date().toISOString(),
  };

  // Only add avatar_url to the update object if a new one was uploaded
  if (avatarUrl) {
    profileData.avatar_url = avatarUrl;
  }

  // Update the user's record in the 'profiles' table
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

  // Revalidate paths to show the new data everywhere
  revalidatePath('/', 'layout'); // This refreshes the header and other layout components

  return { message: 'Profile updated successfully!', type: 'success' };
}