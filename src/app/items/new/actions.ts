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
  // --- Start of Debugging ---
  console.log("--- [ACTION] listItemAction started ---");

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("[ACTION] Error: User not authenticated.");
      return { error: 'You must be logged in to list an item.', success: false };
    }
    console.log(`[ACTION] User verified: ${user.id}`);

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const condition = formData.get('condition') as string;
    const categoryId = formData.get('categoryId') as string;
    const locationDescription = formData.get('locationDescription') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const uploadedImageUrls = formData.getAll('imageUrls') as string[];

    console.log(`[ACTION] Received form data: Title - ${title}, Price - ${price}`);

    if (!title || !price || !condition || !categoryId || !locationDescription) {
      console.error("[ACTION] Error: Missing required form fields.");
      return { error: 'Please fill out all required fields.', success: false };
    }

    const itemPayload = {
      seller_id: user.id, 
      title, 
      description, 
      buy_now_price: parseFloat(price), 
      condition, 
      category_id: parseInt(categoryId),
      images: uploadedImageUrls,
      status: 'available' as const,
      location_description: locationDescription,
      latitude: parseFloat(latitude) || null, 
      longitude: parseFloat(longitude) || null,
    };

    console.log("[ACTION] Attempting to insert item with payload:", itemPayload);

    const { data: newItem, error: insertError } = await supabase
      .from('items')
      .insert(itemPayload)
      .select('id')
      .single();

    if (insertError) {
      console.error("[ACTION] DATABASE INSERT FAILED:", insertError);
      return { error: `Database Error: ${insertError.message}`, success: false };
    }
    if (!newItem) {
      console.error("[ACTION] Error: Item insert did not return a new item ID.");
      return { error: 'Failed to create item record after insert.', success: false };
    }
    
    console.log(`[ACTION] Item inserted successfully with ID: ${newItem.id}`);
    console.log("[ACTION] Attempting to deduct listing fee...");

    const { data: feeDeducted, error: rpcError } = await supabase.rpc('deduct_listing_fee', { 
      p_user_id: user.id 
    });

    if (rpcError || !feeDeducted) {
      console.error(`[ACTION] Fee deduction failed. RPC Error:`, rpcError, `Fee Deducted:`, feeDeducted);
      console.log(`[ACTION] Rolling back: Deleting item with ID ${newItem.id}...`);
      await supabase.from('items').delete().eq('id', newItem.id);
      return { error: 'Could not process listing fee. You may not have enough credits (25 required).', success: false };
    }
    
    console.log("[ACTION] Fee deducted successfully.");
    console.log("[ACTION] Process complete. Revalidating paths.");
    
    revalidatePath('/');
    revalidatePath('/account/dashboard/my-listings');
    return { success: true, error: null };

  } catch (error: any) {
    console.error("[ACTION] An unexpected error occurred in the try-catch block:", error);
    return { error: error.message || 'An unexpected server error occurred.', success: false };
  }
}4