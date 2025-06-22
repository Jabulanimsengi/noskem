'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ListItemFormState {
  error: string | null;
  success: boolean;
}

export async function listItemAction(
  prevState: ListItemFormState,
  formData: FormData
): Promise<ListItemFormState> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'You must be logged in to list an item.', success: false };
    }

    // Get all form fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const condition = formData.get('condition') as string;
    const categoryId = formData.get('categoryId') as string;
    const locationDescription = formData.get('locationDescription') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const uploadedImageUrls = formData.getAll('imageUrls') as string[];

    if (!title || !price || !condition || !categoryId || !locationDescription) {
      return { error: 'Please fill out all required fields.', success: false };
    }

    // Insert the new item, ensuring all fields are included
    const { data: newItem, error: insertError } = await supabase.from('items').insert({
      seller_id: user.id, 
      title, 
      description, 
      buy_now_price: parseFloat(price), 
      condition, 
      category_id: parseInt(categoryId), // This will now be saved correctly
      images: uploadedImageUrls,
      status: 'available',
      location_description: locationDescription, // This will now be saved correctly
      latitude: parseFloat(latitude) || null, 
      longitude: parseFloat(longitude) || null,
    }).select('id').single();

    if (insertError) {
      return { error: `Database Error: ${insertError.message}`, success: false };
    }
    if (!newItem) {
      return { error: 'Failed to create item record after insert.', success: false };
    }

    // Deduct listing fee
    const { data: feeDeducted, error: rpcError } = await supabase.rpc('deduct_listing_fee', { user_id: user.id });

    if (rpcError || !feeDeducted) {
      await supabase.from('items').delete().eq('id', newItem.id);
      return { error: 'Could not process listing fee. You may not have enough credits (25 required).', success: false };
    }
    
    revalidatePath('/');
    revalidatePath('/account/dashboard/my-listings');
    return { success: true, error: null };

  } catch (error: any) {
    console.error('Unexpected error in listItemAction:', error);
    return { error: error.message || 'An unexpected server error occurred.', success: false };
  }
}