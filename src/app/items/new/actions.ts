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

  const { data: feeDeducted, error: rpcError } = await supabase.rpc('deduct_listing_fee', { user_id: user.id });
  if (rpcError || !feeDeducted) return { error: 'Could not process listing fee. You may not have enough credits.', success: false };

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const price = formData.get('price') as string;
  const condition = formData.get('condition') as string;
  const categoryId = formData.get('categoryId') as string;
  const imageFiles = formData.getAll('images') as File[];
  const latitude = formData.get('latitude') as string;
  const longitude = formData.get('longitude') as string;

  if (!categoryId || imageFiles.length === 0 || imageFiles[0].size === 0) {
    return { error: 'Please select a category and upload at least one image.', success: false };
  }

  const uploadedImageUrls: string[] = [];
  for (const image of imageFiles) {
    const fileName = `${user.id}/${Date.now()}_${image.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('item-images').upload(fileName, image);
    if (uploadError) return { error: `Image upload failed: ${uploadError.message}`, success: false };
    const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(uploadData.path);
    uploadedImageUrls.push(publicUrl);
  }

  const { error: insertError } = await supabase.from('items').insert({
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
  });

  if (insertError) return { error: `Failed to list item: ${insertError.message}`, success: false };
  
  revalidatePath('/');
  return { success: true, error: null };
}