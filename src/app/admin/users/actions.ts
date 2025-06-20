// src/app/admin/users/actions.ts

'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

// This action allows an admin to change another user's role.
export async function updateUserRole(formData: FormData) {
  // ... (existing code for this function remains the same)
}


// --- NEW ACTION ---
// This server action allows an admin to adjust a user's credits.
export async function adjustCreditsAction(formData: FormData) {
    const supabase = await createClient();
  
    // 1. Verify that the CURRENT user is an admin.
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) {
      throw new Error('You must be logged in to perform this action.');
    }
  
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();
  
    if (adminProfile?.role !== 'admin') {
      throw new Error('You are not authorized to adjust credits.');
    }

    // 2. Get the data from the form
    const targetUserId = formData.get('userId') as string;
    const amount = parseInt(formData.get('amount') as string);
    const notes = formData.get('notes') as string;

    if (!targetUserId || isNaN(amount) || !notes) {
        throw new Error('Missing required fields for credit adjustment.');
    }

    // 3. Call the secure RPC function to perform the adjustment
    const { error } = await supabase.rpc('adjust_user_credits', {
        p_user_id: targetUserId,
        p_amount_to_adjust: amount,
        p_admin_notes: notes
    });

    if (error) {
        throw new Error(`Failed to adjust credits: ${error.message}`);
    }

    // 4. Revalidate the path to show the new balance immediately.
    revalidatePath('/admin/users');
}