// File: app/items/new/actions.ts

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
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to list an item.', success: false };
  }

  // --- Step 1: Deduct Credits ---
  const { data: feeDeducted, error: rpcError } = await supabase.rpc('deduct_listing_fee', {
    user_id: user.id
  });

  if (rpcError || !feeDeducted) {
    console.error('RPC Error:', rpcError);
    return { error: 'Could not process listing fee. You may not have enough credits.', success: false };
  }

  // --- Step 2: Get Form Data ---
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const price = formData.get('price') as string;
  const condition = formData.get('condition') as string;
  const categoryId = formData.get('categoryId') as string; // Get the category ID
  const imageFiles = formData.getAll('images') as File[];

  if (!categoryId) {
    return { error: 'Please select a category for your item.', success: false };
  }
  if (imageFiles.length === 0 || imageFiles[0].size === 0) {
      return { error: 'Please upload at least one image.', success: false };
  }

  // --- Step 3: Upload Images ---
  const uploadedImageUrls: string[] = [];
  for (const image of imageFiles) {
    const fileName = `${user.id}/${Date.now()}_${image.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(fileName, image);

    if (uploadError) {
      // NOTE: In a real app, you would want to refund the credits here.
      return { error: `Image upload failed: ${uploadError.message}`, success: false };
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('item-images')
      .getPublicUrl(uploadData.path);
    uploadedImageUrls.push(publicUrl);
  }

  // --- Step 4: Insert Item into Database ---
  const { error: insertError } = await supabase.from('items').insert({
    seller_id: user.id,
    title,
    description,
    buy_now_price: parseFloat(price),
    condition,
    category_id: parseInt(categoryId), // Save the category ID
    images: uploadedImageUrls,
    status: 'available',
  });

  if (insertError) {
    return { error: `Failed to list item: ${insertError.message}`, success: false };
  }
  
  // --- Success! ---
  revalidatePath('/'); // Refresh the homepage to show the new item
  return { success: true, error: null };
}