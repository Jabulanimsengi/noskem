'use server';

import { createClient } from '../utils/supabase/server';

export async function markNotificationsAsRead(notificationIds: number[]) {
  const supabase = await createClient(); // Corrected: Added await
  
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
  const supabase = await createClient(); // Corrected: Added await

  if (!profileId || !message || !linkUrl) return;

  // Using an RPC function to create a notification is a great pattern
  const { error } = await supabase.rpc('create_new_notification', {
    p_profile_id: profileId,
    p_message: message,
    p_link_url: linkUrl
  });

  if (error) {
    console.error('Error creating notification via RPC:', error);
  }
}