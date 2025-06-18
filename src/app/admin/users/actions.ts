// File: app/admin/users/actions.ts

'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

// This server action allows an admin to change another user's role.
export async function updateUserRole(formData: FormData) {
  const supabase = await createClient();

  // 1. First, verify that the CURRENT user is an admin.
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
    throw new Error('You are not authorized to change user roles.');
  }

  // 2. Get the target user ID and the new role from the form.
  const targetUserId = formData.get('userId') as string;
  const newRole = formData.get('newRole') as string;

  if (!targetUserId || !newRole) {
    throw new Error('Missing user ID or new role.');
  }

  // 3. Update the target user's profile in the database.
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId);

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`);
  }

  // 4. Revalidate the path to ensure the user list updates immediately.
  revalidatePath('/admin/users');
}