// src/app/admin/users/actions.ts

'use server';

import { createClient } from '../../utils/supabase/server';
import { createAdminClient } from '../../utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface ActionState {
  error: string | null;
  success?: boolean;
  message?: string;
}

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    throw new Error('Authorization Error: You must be an admin to perform this action.');
  }
  return user;
}

export async function updateUserRole(previousState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await verifyAdmin();
    const adminSupabase = createAdminClient();
    
    const userId = formData.get('userId') as string;
    const newRole = formData.get('newRole') as string;

    if (!userId || !['user', 'agent', 'admin'].includes(newRole)) {
      throw new Error('Invalid user ID or role provided.');
    }

    const { error } = await adminSupabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) throw error;

  } catch (error) {
    const err = error as Error;
    return { error: err.message };
  }
  
  revalidatePath('/admin/users');
  return { error: null, success: true, message: "User role updated." };
}

export async function adjustCreditsAction(previousState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await verifyAdmin(); // This already verifies the user is an admin
    const supabase = await createClient();

    const userId = formData.get('userId') as string;
    const amount = parseInt(formData.get('amount') as string, 10);
    const reason = formData.get('notes') as string; // 'notes' from your original file

    if (!userId || isNaN(amount) || !reason) {
      throw new Error('Invalid user ID, amount, or reason provided.');
    }

    // Call the new, single, atomic function
    const { error } = await supabase.rpc('admin_adjust_credits', {
        p_user_id: userId,
        p_amount_to_add: amount,
        p_reason: reason
    });
    if (error) throw new Error(`Credit adjustment failed: ${error.message}`);
    
  } catch (error) {
    const err = error as Error;
    return { error: err.message };
  }

  revalidatePath('/admin/users');
  revalidatePath('/', 'layout');
  return { error: null, success: true, message: "Credits adjusted." };
}

export async function toggleUserBanAction(userId: string, isCurrentlyBanned: boolean) {
  try {
    await verifyAdmin();
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase.auth.admin.updateUserById(
      userId,
      { ban_duration: isCurrentlyBanned ? 'none' : '36500d' } 
    );

    if (error) throw error;
    
  } catch (error) {
    const err = error as Error;
    return { error: `Failed to update user ban status: ${err.message}` };
  }
  revalidatePath('/admin/users');
  return { error: null, success: true, message: isCurrentlyBanned ? "User un-suspended." : "User suspended." };
}


export async function deleteUserAction(userId: string) {
    try {
        await verifyAdmin();
        const adminSupabase = createAdminClient();

        const { error } = await adminSupabase.auth.admin.deleteUser(userId);
        if (error) throw error;

    } catch (error) {
        const err = error as Error;
        return { error: `Failed to delete user: ${err.message}` };
    }
    revalidatePath('/admin/users');
    return { error: null, success: true, message: 'User permanently deleted.' };
}