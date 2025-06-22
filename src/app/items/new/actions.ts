/**
 * CODE REVIEW UPDATE
 * ------------------
 * This file has been updated based on the AI code review.
 *
 * Change Made:
 * - Suggestion #20 (Reliability): Reversed the order of operations to ensure atomicity.
 * 1. The item is inserted into the database FIRST.
 * 2. The listing fee is deducted SECOND.
 * 3. If fee deduction fails, a ROLLBACK operation is performed to delete the
 * item created in step 1. This prevents users from being charged for a failed listing.
 */
'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ListItemFormState {
  error: string | null;
  success: boolean;
}

export async function listItemAction(
  prevState: ListItemFormState,
  formData: FormData
): Promise<ListItemFormState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to list an item.', success: false };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const price = formData.get('price') as string;
  const condition = formData.get('condition') as string;
  const categoryId = formData.get('categoryId') as string;
  const imageFiles = formData.getAll('images') as File[];
  const latitude = formData.get('latitude') as string;
  const longitude = formData.get('longitude') as string;

  if (!title || !price || !condition || !categoryId || imageFiles.length === 0 || imageFiles[0].size === 0) {
    return { error: 'Please fill all required fields and upload at least one image.', success: false };
  }

  const uploadedImageUrls: string[] = [];
  for (const image of imageFiles) {
    const fileName = `${user.id}/${Date.now()}_${image.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('item-images').upload(fileName, image);
    if (uploadError) return { error: `Image upload failed: ${uploadError.message}`, success: false };
    const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(uploadData.path);
    uploadedImageUrls.push(publicUrl);
  }

  // --- Step 1: Insert the item into the database ---
  const { data: newItem, error: insertError } = await supabase.from('items').insert({
    seller_id: user.id, 
    title, 
    description, 
    buy_now_price: parseFloat(price), 
    condition, 
    category_id: parseInt(categoryId),
    images: uploadedImageUrls, 
    status: 'available', 
    latitude: parseFloat(latitude) || null, 
    longitude: parseFloat(longitude) || null,
  }).select('id').single();

  if (insertError) return { error: `Failed to list item: ${insertError.message}`, success: false };
  if (!newItem) return { error: 'Failed to create item and get its ID.', success: false };

  // --- Step 2: ONLY AFTER successful insertion, deduct the listing fee ---
  const { data: feeDeducted, error: rpcError } = await supabase.rpc('deduct_listing_fee', { p_user_id: user.id });

  if (rpcError || !feeDeducted) {
    // !! IMPORTANT ROLLBACK STEP !!
    // If the fee deduction fails, delete the item we just created to keep data consistent.
    await supabase.from('items').delete().eq('id', newItem.id);
    // Also consider deleting the uploaded images for a full cleanup.
    
    return { error: 'Could not process listing fee. You may not have enough credits. The listing has been cancelled.', success: false };
  }
  
  revalidatePath('/');
  return { success: true, error: null };
}