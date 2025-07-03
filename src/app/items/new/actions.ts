// src/app/items/new/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Define the shape of the state object returned by the action
export interface ListItemFormState {
  error: string | null;
  success: boolean;
  newItemId?: number;
}

// Define a schema for validating the form data on the server
const itemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be a positive number.'),
  categoryId: z.coerce.number().positive('You must select a category.'),
  condition: z.enum(['new', 'like_new', 'used_good', 'used_fair']),
  imageUrls: z.array(z.string().url()).min(1, 'At least one image is required.'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  locationDescription: z.string().optional(),
});

export async function listItemAction(
  previousState: ListItemFormState,
  formData: FormData
): Promise<ListItemFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to list an item.', success: false };
  }

  // Parse and validate the form data using the schema
  const validatedFields = itemSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    price: formData.get('price'),
    categoryId: formData.get('categoryId'),
    condition: formData.get('condition'),
    imageUrls: formData.getAll('imageUrls'), // Get all image URLs
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    locationDescription: formData.get('locationDescription'),
  });

  // If validation fails, return the error messages
  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.toString(),
      success: false,
    };
  }

  // Call the single, atomic database function we created earlier
  const { data: newItemId, error } = await supabase.rpc('handle_new_item_listing', {
    p_seller_id: user.id,
    p_title: validatedFields.data.title,
    p_description: validatedFields.data.description,
    p_category_id: validatedFields.data.categoryId,
    p_condition: validatedFields.data.condition,
    p_buy_now_price: validatedFields.data.price,
    p_images: validatedFields.data.imageUrls,
    p_latitude: validatedFields.data.latitude,
    p_longitude: validatedFields.data.longitude,
    p_location_description: validatedFields.data.locationDescription,
  });

  // If the database function returns an error, pass it directly to the form
  if (error) {
    return { error: error.message, success: false };
  }

  // On success, revalidate paths and return the new item's ID
  revalidatePath('/search');
  revalidatePath('/account/dashboard/my-listings');

  return { success: true, error: null, newItemId: newItemId as number };
}