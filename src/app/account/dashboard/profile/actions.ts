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
    return { message: 'Authentication required.', type: 'error' };
  }

  const username = formData.get('username') as string;
  const firstName = formData.get('firstName') as string | null;
  const lastName = formData.get('lastName') as string | null;
  const companyName = formData.get('companyName') as string | null;
  const avatarFile = formData.get('avatar') as File;

  const profileUpdateData: {
    username?: string;
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
    avatar_url?: string;
  } = { username, first_name: firstName, last_name: lastName, company_name: companyName };

  if (avatarFile && avatarFile.size > 0) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();
      
    const oldAvatarUrl = profileData?.avatar_url;
    if (oldAvatarUrl) {
        const oldAvatarFileName = oldAvatarUrl.split('/').pop();
        if(oldAvatarFileName){
             await supabase.storage.from('avatars').remove([oldAvatarFileName]);
        }
    }
    
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile);

    if (uploadError) {
      return { message: `Avatar upload failed: ${uploadError.message}`, type: 'error' };
    }
    
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    profileUpdateData.avatar_url = publicUrl;
  }

  const { error } = await supabase.from('profiles').update(profileUpdateData).eq('id', user.id);

  if (error) {
    if (error.code === '23505') {
        return { message: 'This username is already taken.', type: 'error' };
    }
    return { message: `Failed to update profile: ${error.message}`, type: 'error' };
  }

  revalidatePath('/account/dashboard/profile');
  if (username) {
    revalidatePath(`/sellers/${username}`);
  }
  return { message: 'Profile updated successfully!', type: 'success' };
}