'use server';

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';

// This action marks a list of notification IDs as read for the current user
export async function markNotificationsAsRead(notificationIds: number[]) {
  if (!notificationIds || notificationIds.length === 0) return;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .in('id', notificationIds)
    .eq('profile_id', user.id); // Security check
}

// This action calls our new, secure database function to create a notification
export async function createNotification(
  profileId: string,
  message: string,
  linkUrl: string
) {
  const supabase = await createClient();
  if (!profileId || !message || !linkUrl) return;

  // Call the secure RPC function instead of a direct insert
  const { error } = await supabase.rpc('create_new_notification', {
    p_profile_id: profileId,
    p_message: message,
    p_link_url: linkUrl
  });

  if (error) {
    console.error('Error creating notification via RPC:', error);
  }
}