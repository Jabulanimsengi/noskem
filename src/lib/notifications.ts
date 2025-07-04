// src/lib/notifications.ts

import { createClient } from '@/utils/supabase/server';

interface NotificationPayload {
  profile_id: string;
  message: string;
  link_url: string;
}

/**
 * Creates a single notification for a user using a secure database function.
 */
export async function createNotification(payload: NotificationPayload) {
  const supabase = createClient();
  const { error } = await supabase.rpc('create_single_notification', {
    p_profile_id: payload.profile_id,
    p_message: payload.message,
    p_link_url: payload.link_url,
  });

  if (error) {
    console.error('Error creating single notification:', error);
  }
}

/**
 * Creates multiple notifications for different users in a single, secure database call.
 */
export async function createBulkNotifications(payloads: NotificationPayload[]) {
  const supabase = createClient();
  const { error } = await supabase.rpc('create_bulk_notifications_securely', {
    notifications_data: payloads,
  });

  if (error) {
    console.error('Error creating bulk notifications:', error);
  }
}