'use server';

import { createClient } from './utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Marks a batch of notifications as read for the currently logged-in user.
 */
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

  // Revalidate the layout to ensure the header refetches the new read status
  revalidatePath('/', 'layout');
}

/**
 * Creates a new notification for a specific user by calling a database function.
 * This is a robust way to handle notification creation.
 * @param profileId The user to notify.
 * @param message The notification message.
 * @param linkUrl The URL the notification should link to.
 */
export async function createNotification(
  profileId: string,
  message: string,
  linkUrl: string
) {
  const supabase = await createClient();

  if (!profileId || !message || !linkUrl) return;

  // Calls the `create_new_notification` function in your Supabase project
  const { error } = await supabase.rpc('create_new_notification', {
    p_profile_id: profileId,
    p_message: message,
    p_link_url: linkUrl
  });

  if (error) {
    console.error("Error creating notification via RPC:", error.message);
  }
}

/**
 * Toggles the read status of a single notification for the current user.
 * @param notificationId The ID of the notification to update.
 * @param newStatus The new read status (true or false).
 */
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

/**
 * Deletes all notifications for the currently logged-in user.
 */
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