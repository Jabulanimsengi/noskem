import { createAdminClient } from '@/utils/supabase/admin';

interface NotificationPayload {
  profile_id: string;
  message: string;
  link_url?: string;
}

/**
 * Creates a single notification for a user.
 * @param payload - The notification details.
 */
export async function createNotification(payload: NotificationPayload) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('notifications').insert(payload);

  if (error) {
    console.error(`Failed to create notification for profile ${payload.profile_id}:`, error.message);
  }
}

/**
 * Creates multiple notifications at once.
 * @param payloads - An array of notification details.
 */
export async function createBulkNotifications(payloads: NotificationPayload[]) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('notifications').insert(payloads);

    if (error) {
        console.error(`Failed to create bulk notifications:`, error.message);
    }
}