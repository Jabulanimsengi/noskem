'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleFeaturedAction(itemId: number, currentStatus: boolean) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error('Authorization required');

  const { error } = await supabase
    .from('items')
    .update({ is_featured: !currentStatus })
    .eq('id', itemId);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  revalidatePath('/admin/items');
  revalidatePath('/');
}