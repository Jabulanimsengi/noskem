// File: app/components/actions.ts

'use server';

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';

// This action marks a list of notification IDs as read.
export async function markNotificationsAsRead(notificationIds: number[]) {
  // Ensure we have IDs to work with
  if (!notificationIds || notificationIds.length === 0) {
    return;
  }
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Silently fail if there's no user, as this should not happen.
    return;
  }

  // Update the 'is_read' status for the given notification IDs
  // that belong to the current user.
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .in('id', notificationIds)
    .eq('profile_id', user.id); // Security check

  if (error) {
    console.error('Error marking notifications as read:', error);
    return;
  }

  // Revalidate the header path to update the unread count.
  // Note: While realtime updates the client, revalidation ensures consistency.
  revalidatePath('/', 'layout');
}