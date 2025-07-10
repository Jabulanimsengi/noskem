'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications'

type ActionResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

// This function now correctly uses a secure RPC call
export async function updateServiceStatus(providerId: number, userId: string, businessName: string, status: 'approved' | 'rejected'): Promise<ActionResponse> {
  const supabase = createClient()
  
  const { error } = await supabase.rpc('approve_or_reject_service', {
    provider_id: providerId,
    new_status: status
  })
    
  if (error) {
    console.error(`Error updating service status to ${status}:`, error)
    return { error: `Failed to ${status} the service provider. Reason: ${error.message}` }
  }
  
  await createNotification({
    profile_id: userId,
    message: `Your application for "${businessName}" has been ${status}.`,
    link_url: `/account/dashboard`, 
  });
  
  revalidatePath('/admin/services')
  return { success: true, message: `Service provider has been ${status}.` }
}


// --- THIS FUNCTION IS NOW FIXED ---
// It now uses the new secure RPC function to toggle the feature status
export async function toggleServiceFeature(providerId: number, currentStatus: boolean): Promise<ActionResponse> {
    const supabase = createClient()

    const { error } = await supabase.rpc('toggle_service_provider_feature', {
      provider_id: providerId
    })

    if (error) {
        console.error('Error toggling feature status:', error)
        return { error: `Failed to update feature status. Reason: ${error.message}` }
    }
    
    revalidatePath('/admin/services')
    revalidatePath('/') 
    return { success: true, message: `Feature status updated.` }
}