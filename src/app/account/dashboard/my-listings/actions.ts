'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface UpdateItemFormState {
  error: string | null;
  success: boolean;
}

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

  revalidatePath('/account/dashboard/my-listings');
  revalidatePath('/'); 

  return { success: true, message: 'Listing deleted successfully.' };
}

// NEW FUNCTION: Update an existing item
export async function updateItemAction(
  prevState: UpdateItemFormState,
  formData: FormData
): Promise<UpdateItemFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update an item.', success: false };
  }

  const itemId = parseInt(formData.get('itemId') as string);
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const price = formData.get('price') as string;
  const condition = formData.get('condition') as string;
  const categoryId = formData.get('categoryId') as string;

  if (!itemId || !title || !price || !condition || !categoryId) {
    return { error: 'Please fill out all required fields.', success: false };
  }

  // Verify the user owns the item before updating
  const { data: item, error: fetchError } = await supabase
    .from('items')
    .select('seller_id')
    .eq('id', itemId)
    .single();

  if (fetchError || !item) {
    return { error: 'Item not found.', success: false };
  }

  if (item.seller_id !== user.id) {
    return { error: 'You are not authorized to edit this item.', success: false };
  }

  // Proceed with the update
  const { error: updateError } = await supabase
    .from('items')
    .update({
      title,
      description,
      buy_now_price: parseFloat(price),
      condition,
      category_id: parseInt(categoryId),
    })
    .eq('id', itemId);

  if (updateError) {
    return { error: `Failed to update item: ${updateError.message}`, success: false };
  }
  
  revalidatePath(`/account/dashboard/my-listings`);
  revalidatePath(`/items/${itemId}`);
  
  redirect('/account/dashboard/my-listings');
}
