'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

// This server action is called by the client AFTER a successful payment authorization.
export async function updateOrderStatus(
    orderId: number, 
    paystackRef: string
) {
  const supabase = await createClient();

  // 1. Update the order with the Paystack reference and new status
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'payment_authorized',
      paystack_ref: paystackRef,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select('id, item_id') // FIX: Explicitly select the columns needed below
    .single();

  if (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }

  // 2. Update the item's status to 'sold'
  const { error: itemUpdateError } = await supabase
    .from('items')
    .update({ status: 'sold' })
    .eq('id', data.item_id); // FIX: No longer a type error

  if (itemUpdateError) {
    // Note: Consider how to handle this failure case. Should the order status be rolled back?
    console.error('Error updating item status:', itemUpdateError);
    return { success: false, error: itemUpdateError.message };
  }

  // 3. Revalidate paths to show updated data
  revalidatePath('/');
  revalidatePath(`/items/${data.item_id}`);
  revalidatePath(`/orders/${orderId}`);

  return { success: true };
}