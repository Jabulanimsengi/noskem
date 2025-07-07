// src/app/admin/verifications/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// NOTE: We are no longer importing 'createNotification' from the helper file.

// Define a consistent response type for the actions
type ActionResponse = {
  success: boolean;
  message: string;
};

// --- This is the corrected logic for approving a verification ---
export async function approveVerificationAction(profileId: string): Promise<ActionResponse> {
  const supabase = createClient();
  
  // Security Check: Ensure the person performing the action is an admin
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) {
    return { success: false, message: 'Authentication required.' };
  }
  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
  if (adminProfile?.role !== 'admin') {
    return { success: false, message: 'You are not authorized to perform this action.' };
  }

  // Update the target profile's verification status to 'verified'
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ verification_status: 'verified' })
    .eq('id', profileId);

  if (updateError) {
    console.error('Error approving verification:', updateError);
    return { success: false, message: 'Could not approve verification.' };
  }

  // --- FIX: Use a direct RPC call to the database function for notifications ---
  const { error: notificationError } = await supabase.rpc('create_single_notification', {
    p_profile_id: profileId,
    p_message: 'Congratulations! Your ID has been verified.',
    p_link_url: '/account/dashboard/verification',
  });

  if (notificationError) {
    // Log the error but don't block the success message
    console.error('Error creating approval notification:', notificationError);
  }

  revalidatePath('/admin/verifications');
  revalidatePath(`/sellers/${profileId}`);
  
  return { success: true, message: 'Verification approved successfully.' };
}

// --- This is the corrected logic for rejecting a verification ---
export async function rejectVerificationAction(profileId: string, rejectionReason: string): Promise<ActionResponse> {
  const supabase = createClient();

  // Security Check: Ensure the person performing the action is an admin
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) {
    return { success: false, message: 'Authentication required.' };
  }
  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
  if (adminProfile?.role !== 'admin') {
    return { success: false, message: 'You are not authorized to perform this action.' };
  }

  // Update the target profile's verification status to 'rejected'
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ verification_status: 'rejected' })
    .eq('id', profileId);
  
  if (updateError) {
    console.error('Error rejecting verification:', updateError);
    return { success: false, message: 'Could not reject verification.' };
  }

  // --- FIX: Use a direct RPC call for notifications ---
  const { error: notificationError } = await supabase.rpc('create_single_notification', {
    p_profile_id: profileId,
    p_message: `Your ID verification was not successful. Reason: ${rejectionReason}`,
    p_link_url: '/account/dashboard/verification',
  });

  if (notificationError) {
    console.error('Error creating rejection notification:', notificationError);
  }

  revalidatePath('/admin/verifications');
  
  return { success: true, message: 'Verification has been rejected.' };
}