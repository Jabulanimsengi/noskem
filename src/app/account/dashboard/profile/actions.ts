// src/app/account/dashboard/profile/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Define the schema for strong server-side validation
const ProfileUpdateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  first_name: z.string().min(1, 'First name is required').nullable(),
  last_name: z.string().min(1, 'Last name is required').nullable(),
  company_name: z.string().nullable(),
});

export interface UpdateProfileState {
  message: string;
  type: 'success' | 'error' | null;
}

export async function updateUserProfile(
  prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const supabase = createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: 'Authentication required.', type: 'error' };
  }

  // Prepare data for validation
  const rawData = {
    username: formData.get('username') as string,
    first_name: formData.get('firstName') as string | null,
    last_name: formData.get('lastName') as string | null,
    company_name: formData.get('companyName') as string | null,
  };

  // Validate the data against the schema
  const validation = ProfileUpdateSchema.safeParse(rawData);

  if (!validation.success) {
    // Return a user-friendly error message from validation
    const firstError = Object.values(validation.error.flatten().fieldErrors)[0]?.[0];
    return { message: firstError || 'Invalid data provided.', type: 'error' };
  }

  const { username, first_name, last_name, company_name } = validation.data;
  const avatarFile = formData.get('avatar') as File | null;
  
  const profileUpdateData: {
    username: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    avatar_url?: string;
    updated_at: string;
  } = { 
    ...validation.data,
    updated_at: new Date().toISOString() 
  };

  // --- Improved Avatar Upload Logic ---
  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop();
    // Use a consistent file path for each user's avatar.
    // This prevents orphaned files in your storage bucket.
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, {
        upsert: true, // `upsert` is crucial: it overwrites the file if it exists.
      });

    if (uploadError) {
      console.error('Avatar Upload Error:', uploadError);
      return { message: `Avatar upload failed: ${uploadError.message}`, type: 'error' };
    }

    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
      
    profileUpdateData.avatar_url = publicUrl;
  }

  // --- Update Profile in Database ---
  const { error } = await supabase
    .from('profiles')
    .update(profileUpdateData)
    .eq('id', user.id);

  if (error) {
    console.error('Profile Update Error:', error);
    // Handle specific, common errors gracefully
    if (error.code === '23505') { // Unique constraint violation
      return { message: 'This username is already taken.', type: 'error' };
    }
    return { message: `Failed to update profile: ${error.message}`, type: 'error' };
  }

  // Revalidate paths to show updated data immediately
  revalidatePath('/account/dashboard/profile');
  if (username) {
    revalidatePath(`/sellers/${username}`);
  }

  return { message: 'Profile updated successfully!', type: 'success' };
}
