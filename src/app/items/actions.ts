// src/app/items/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type ActionResponse = {
  success: boolean;
  message: string;
};

export async function createItemAction(formData: FormData): Promise<ActionResponse> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'You must be logged in to create a listing.' };
  }

  // Get the value from the form. The debug log confirmed it's named 'new_item_price'.
  const newItemPriceValue = formData.get('new_item_price') as string;

  // This is the database function call that needs to be corrected.
  const { error } = await supabase.rpc('handle_new_item_listing', {
    p_seller_id: user.id,
    p_title: formData.get('title') as string,
    p_description: formData.get('description') as string,
    p_category_id: Number(formData.get('category')),
    p_condition: formData.get('condition') as 'new' | 'like_new' | 'used_good' | 'used_fair',
    p_buy_now_price: Number(formData.get('price')),
    // --- THIS IS THE FIX ---
    // We are now passing the new_item_price to the database.
    // It's converted to a number, or set to null if the user left it blank.
    p_new_item_price: newItemPriceValue ? Number(newItemPriceValue) : null,
    p_images: JSON.parse(formData.get('imageUrls') as string),
    p_latitude: Number(formData.get('latitude')),
    p_longitude: Number(formData.get('longitude')),
    p_location_description: formData.get('locationDescription') as string,
  });

  if (error) {
    console.error('Error creating new item:', error);
    return { success: false, message: `An error occurred: ${error.message}` };
  }

  revalidatePath('/');
  revalidatePath('/account/dashboard/my-listings');
  
  return { success: true, message: 'Item listed successfully!' };
}