'use server';

import { createClient } from '../../utils/supabase/server';
import { createAdminClient } from '../../utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// This is the shape of the state object our actions will return
interface ActionState {
  error: string | null;
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

// FIX: The function now accepts 'previousState' as the first argument.
export async function updateUserRole(previousState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await verifyAdmin();
    const adminSupabase = await createAdminClient();
    
    const userId = formData.get('userId') as string;
    const newRole = formData.get('newRole') as string;

    if (!userId || !['user', 'agent', 'admin'].includes(newRole)) {
      throw new Error('Invalid user ID or role provided.');
    }

    const { error } = await adminSupabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) throw error;

  } catch (error: any) {
    return { error: error.message };
  }
  
  revalidatePath('/admin/users');
  return { error: null };
}

// FIX: The function now accepts 'previousState' as the first argument.
export async function adjustCreditsAction(previousState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const adminUser = await verifyAdmin();
    const supabase = await createClient();

    const userId = formData.get('userId') as string;
    const amount = parseInt(formData.get('amount') as string, 10);
    const notes = formData.get('notes') as string;

    if (!userId || isNaN(amount) || !notes) {
      throw new Error('Invalid user ID, amount, or reason provided.');
    }

    const { error } = await supabase.rpc('add_credits_to_user', { user_id: userId, amount_to_add: amount });
    if (error) throw new Error(`Credit adjustment failed: ${error.message}`);

    await supabase.from('credit_transactions').insert({
        profile_id: userId,
        amount: amount,
        description: `Manual adjustment by admin (${adminUser.email}): ${notes}`
    });
    
  } catch (error: any) {
    return { error: error.message };
  }

  revalidatePath('/admin/users');
  revalidatePath('/', 'layout');
  return { error: null };
}