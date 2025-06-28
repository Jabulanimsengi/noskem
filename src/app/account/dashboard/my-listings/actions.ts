'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { FEATURE_FEE } from '@/lib/constants';
import { createNotification } from '@/app/actions';

export interface UpdateItemFormState {
  error: string | null;
  success: boolean;
}

// ... deleteItemAction and featureItemAction remain the same ...

export async function deleteItemAction(itemId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Authentication required.');
  }

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

export async function featureItemAction(itemId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { error } = await supabase.rpc('feature_item', {
    p_user_id: user.id,
    p_item_id: itemId,
    p_feature_fee: FEATURE_FEE
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/account/dashboard/my-listings');
  revalidatePath('/'); 
  return { success: true, message: 'Your item is now featured!' };
}

export async function applyDiscountAction(itemId: number, percentage: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Authentication required.');
    }

    if(percentage < 0 || percentage > 90) {
        throw new Error('Discount must be between 0 and 90 percent.');
    }

    const { data: item, error: updateError } = await supabase
        .from('items')
        .update({ discount_percentage: percentage })
        .eq('id', itemId)
        .eq('seller_id', user.id)
        .select('title')
        .single();

    if (updateError || !item) {
        throw new Error(`Failed to apply discount: ${updateError?.message || 'Item not found.'}`);
    }

    // --- Price Drop Alert Logic ---
    const { data: likes } = await supabase.from('likes').select('user_id').eq('item_id', itemId);
    if (likes) {
        const notificationMessage = `Good news! An item you liked, "${item.title}", is now on sale.`;
        for (const like of likes) {
            await createNotification(like.user_id, notificationMessage, `/items/${itemId}`);
        }
    }
    // --- End of Logic ---

    revalidatePath(`/items/${itemId}`);
    revalidatePath('/account/dashboard/my-listings');
    return { success: true, message: 'Discount applied!' };
}


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
  const newItemPrice = formData.get('newItemPrice') as string;
  const purchaseDate = formData.get('purchaseDate') as string;
  const condition = formData.get('condition') as string;
  const categoryId = formData.get('categoryId') as string;

  if (!title || title.trim().length === 0) {
    return { error: 'The item title cannot be empty.', success: false };
  }
  
  if (!itemId || !price || !condition || !categoryId) {
    return { error: 'Please fill out all required fields.', success: false };
  }

  const { data: item, error: fetchError } = await supabase
    .from('items')
    .select('seller_id, status')
    .eq('id', itemId)
    .single();

  if (fetchError || !item) {
    return { error: 'Item not found.', success: false };
  }

  if (item.seller_id !== user.id) {
    return { error: 'You are not authorized to edit this item.', success: false };
  }

  if (item.status !== 'available') {
    return { error: 'This item has been sold and can no longer be edited.', success: false };
  }

  const { error: updateError } = await supabase
    .from('items')
    .update({
      title,
      description,
      buy_now_price: parseFloat(price),
      new_item_price: parseFloat(newItemPrice),
      purchase_date: purchaseDate,
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