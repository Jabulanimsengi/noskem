'use server';

import { createClient } from './utils/supabase/server';
// FIX: Import revalidatePath to update the cache
import { revalidatePath } from 'next/cache';

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

  // FIX: Revalidate the layout to ensure the header refetches the new read status
  revalidatePath('/', 'layout');
}

// ... (createNotification function remains the same) ...
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
    .eq('profile_id', user.id);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }
  
  revalidatePath('/', 'layout');
}

// FIX: New function to clear all notifications for the current user
export async function clearAllNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Authentication required.');
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('profile_id', user.id);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  revalidatePath('/', 'layout');
}