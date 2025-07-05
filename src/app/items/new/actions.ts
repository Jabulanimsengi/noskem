// src/app/items/new/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// --- FIX: Export the FormState type so it can be imported. ---
export type FormState = {
  success: boolean;
  message: string;
  itemId?: number;
};

export async function createItem(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'You must be logged in to create an item.' };
  }

  // --- 1. Handle Image Uploads ---
  const imageFiles = formData.getAll('images') as File[];
  const imageUrls: string[] = [];

  if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      for (const file of imageFiles) {
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
              .from('item-images')
              .upload(fileName, file);

          if (uploadError) {
              console.error('Error uploading image:', uploadError);
              return { success: false, message: `Failed to upload image: ${uploadError.message}` };
          }
          
          const { data: { publicUrl } } = supabase.storage
              .from('item-images')
              .getPublicUrl(uploadData.path);
          
          imageUrls.push(publicUrl);
      }
  } else {
      return { success: false, message: 'At least one image is required.' };
  }

  // --- 2. Prepare Item Data from Form ---
  const newItemPriceValue = formData.get('new_item_price');
  const purchaseDateValue = formData.get('purchase_date');
  const categoryIdValue = formData.get('category');

  const itemData = {
    seller_id: user.id,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    images: imageUrls,
    category_id: categoryIdValue ? Number(categoryIdValue) : null,
    condition: formData.get('condition') as 'new' | 'like_new' | 'used_good' | 'used_fair',
    buy_now_price: Number(formData.get('price')),
    new_item_price: newItemPriceValue ? Number(newItemPriceValue) : null,
    latitude: Number(formData.get('latitude')),
    longitude: Number(formData.get('longitude')),
    location_description: formData.get('locationDescription') as string,
    purchase_date: purchaseDateValue ? (purchaseDateValue as string) : null,
    status: 'available' as const,
    is_featured: false,
    discount_percentage: 0,
  };
  
  if (!itemData.title || !itemData.buy_now_price || !itemData.category_id) {
      return { success: false, message: 'Please fill out all required fields.' };
  }

  // --- 3. Insert into Database ---
  const { data: newItem, error } = await supabase
    .from('items')
    .insert(itemData)
    .select()
    .single();

  if (error) {
    console.error('Error creating item:', error);
    return { success: false, message: `Failed to create item: ${error.message}` };
  }

  // --- 4. Revalidate Paths and Return Success ---
  revalidatePath('/');
  revalidatePath('/search');
  revalidatePath(`/items/${newItem.id}`);
  
  return { success: true, message: 'Item created successfully!', itemId: newItem.id };
}
