'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveVerificationAction(profileId: string) {
    const supabase = createClient();

    // Update the profile's verification status
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ verification_status: 'verified' })
        .eq('id', profileId);

    if (updateError) {
        console.error('Error approving verification:', updateError);
        throw new Error('Could not approve verification.');
    }

    // Award the 'verified_id' badge to the user
    const { error: badgeError } = await supabase.rpc('award_badge_if_not_exists', {
        p_user_id: profileId,
        p_badge_type: 'verified_id',
    });

    if (badgeError) {
        // Log the error but don't throw, as the main action succeeded.
        // The user is verified, even if the badge failed to apply.
        console.error('Error awarding verification badge:', badgeError);
    }

    // Create a notification for the user
    const { error: notificationError } = await supabase.rpc('create_new_notification', {
        p_profile_id: profileId,
        p_message: 'Congratulations! Your ID has been verified.',
        p_link_url: '/account/dashboard/verification',
    });

     if (notificationError) {
        console.error('Error creating verification approval notification:', notificationError);
    }

    revalidatePath('/admin/verifications');
    revalidatePath(`/sellers/${profileId}`); // Revalidate seller profile to show badge
    return { success: true, message: 'Verification approved and badge awarded.' };
}

export async function rejectVerificationAction(profileId: string, rejectionReason: string) {
    const supabase = createClient();

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ verification_status: 'rejected' })
        .eq('id', profileId);
    
    if (updateError) {
        console.error('Error rejecting verification:', updateError);
        throw new Error('Could not reject verification.');
    }

    // Notify the user about the rejection
    const { error: notificationError } = await supabase.rpc('create_new_notification', {
        p_profile_id: profileId,
        p_message: `Your ID verification was not successful. Reason: ${rejectionReason}`,
        p_link_url: '/account/dashboard/verification',
    });

     if (notificationError) {
        console.error('Error creating verification rejection notification:', notificationError);
    }

    revalidatePath('/admin/verifications');
    return { success: true, message: 'Verification has been rejected.' };
}