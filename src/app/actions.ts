'use server';

import { createClient } from './utils/supabase/server';
import { revalidatePath } from 'next/cache'; // Import revalidatePath

export async function markNotificationsAsRead(notificationIds: number[]) {
  const supabase = await createClient();
  
  if (!notificationIds || notificationIds.length === 0) return;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .in('id', notificationIds)
    .eq('profile_id', user.id);
}

export async function createNotification(
  profileId: string,
  message: string,
  linkUrl: string
) {
  const supabase = await createClient();

  if (!profileId || !message || !linkUrl) return;

  await supabase.rpc('create_new_notification', {
    p_profile_id: profileId,
    p_message: message,
    p_link_url: linkUrl
  });
}

// FIX: New function to toggle the read status of a single notification
export async function toggleNotificationReadStatus(notificationId: number, newStatus: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: newStatus })
    .eq('id', notificationId)
    .eq('profile_id', user.id); // Security check to ensure users can only modify their own notifications

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }
  
  // Revalidate the path to ensure the header component might refetch data if needed.
  revalidatePath('/', 'layout');
}