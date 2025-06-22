'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Action to delete a user's own item
export async function deleteItemAction(itemId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Authentication required.');
  }

  // First, verify the user owns the item
  const { data: item, error: fetchError } = await supabase
    .from('items')
    .select('id, seller_id, images')
    .eq('id', itemId)
    .single();

  if (fetchError || !item) {
    throw new Error('Item not found.');
  }

  if (item.seller_id !== user.id) {
    throw new Error('You are not authorized to delete this item.');
  }

  // Delete the item from the database
  const { error: deleteError } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId);

  if (deleteError) {
    throw new Error(`Failed to delete item: ${deleteError.message}`);
  }

  // Revalidate paths to update the UI
  revalidatePath('/account/dashboard/my-listings');
  revalidatePath('/'); // Revalidate homepage in case the item was there

  return { success: true, message: 'Listing deleted successfully.' };
}