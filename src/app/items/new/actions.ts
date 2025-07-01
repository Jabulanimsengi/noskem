'use server';

import { createClient } from '@/app/utils/supabase/server';
import { LISTING_FEE } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface ListItemFormState {
  error: string | null;
  success: boolean;
  itemId?: number;
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

  // --- 1. Gather all data from the form ---
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const newItemPrice = formData.get('newItemPrice') ? parseFloat(formData.get('newItemPrice') as string) : null;
  const categoryId = parseInt(formData.get('categoryId') as string, 10);
  const condition = formData.get('condition') as 'new' | 'like_new' | 'used_good' | 'used_fair';
  const purchaseDate = formData.get('purchaseDate') as string || null;
  const locationDescription = formData.get('locationDescription') as string;
  const latitude = parseFloat(formData.get('latitude') as string);
  const longitude = parseFloat(formData.get('longitude') as string);
  const imageUrls = formData.getAll('imageUrls') as string[];

  // Basic validation
  if (!title || !price || !categoryId || !condition || imageUrls.length === 0) {
      return { error: 'Missing required fields. Please complete the form.', success: false };
  }

  // --- 2. Deduct the listing fee ---
  const { data: feeDeducted, error: rpcError } = await supabase.rpc('deduct_listing_fee', {
    p_user_id: user.id
  });

  if (rpcError || !feeDeducted) {
    return { error: 'Could not process listing fee. You may not have enough credits.', success: false };
  }

  // Log the financial transaction for the fee
  await supabase.from('financial_transactions').insert({
      user_id: user.id,
      order_id: null,
      type: 'listing_fee',
      status: 'completed',
      amount: -LISTING_FEE,
      description: `Fee for listing item: "${title}"`
  });

  // --- 3. Insert the new item into the database ---
  const { data: newItem, error: insertError } = await supabase
    .from('items')
    .insert({
      title,
      description,
      buy_now_price: price,
      new_item_price: newItemPrice,
      category_id: categoryId,
      condition,
      purchase_date: purchaseDate,
      seller_id: user.id,
      images: imageUrls,
      location_description: locationDescription,
      latitude,
      longitude,
      status: 'available' // Set initial status
    })
    .select('id')
    .single();

  if (insertError) {
      console.error("Database insert error:", insertError);
      return { error: `Failed to list item: ${insertError.message}`, success: false };
  }

  // --- 4. Revalidate paths to show the new item ---
  revalidatePath('/'); // For the homepage carousels and item list
  revalidatePath('/account/dashboard/my-listings'); // For the user's own listings page

  // --- 5. Redirect to the new item's page ---
  // The '?created=true' param can be used by a toast component on the item page
  redirect(`/items/${newItem.id}?created=true`);
}