'use server';

import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
// Import the new fee constants
import { INSPECTION_FEE, COLLECTION_FEE, DELIVERY_FEE, PURCHASE_FEE } from '@/lib/constants';

export interface FormState {
  error: string | null;
}

export async function createCheckoutSession(
  prevState: FormState,
  formData: FormData
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/?authModal=true');
  }
  
  const itemId = formData.get('itemId') as string;
  const sellerId = formData.get('sellerId') as string;
  const itemPrice = parseFloat(formData.get('itemPrice') as string);

  // FIX: Read the selected optional fees from the form data
  const includeInspection = formData.get('includeInspection') === 'true';
  const includeCollection = formData.get('includeCollection') === 'true';
  const includeDelivery = formData.get('includeDelivery') === 'true';

  if (!itemId || !sellerId || isNaN(itemPrice)) {
    return { error: "Missing required item information." };
  }
  if (user.id === sellerId) {
    return { error: "You cannot buy your own item." };
  }
  
  const { data: feeDeducted, error: rpcError } = await supabase.rpc('deduct_purchase_fee', { p_user_id: user.id });
  if (rpcError || !feeDeducted) {
    return { error: `Could not process purchase fee. You may not have enough credits (${PURCHASE_FEE} required).` };
  }
  
  // FIX: Calculate the final amount based on the selected fees
  let finalAmount = itemPrice;
  if (includeInspection) finalAmount += INSPECTION_FEE;
  if (includeCollection) finalAmount += COLLECTION_FEE;
  if (includeDelivery) finalAmount += DELIVERY_FEE;

  const { data: orderData, error: insertError } = await supabase
    .from('orders').insert({
      item_id: parseInt(itemId),
      buyer_id: user.id,
      seller_id: sellerId,
      final_amount: finalAmount,
      status: 'pending_payment',
      // FIX: Save the individual fee amounts to the database
      inspection_fee_paid: includeInspection ? INSPECTION_FEE : 0,
      collection_fee_paid: includeCollection ? COLLECTION_FEE : 0,
      delivery_fee_paid: includeDelivery ? DELIVERY_FEE : 0,
    }).select().single();

  if (insertError) {
      return { error: `Could not create order: ${insertError.message}` };
  }
  
  revalidatePath('/');
  revalidatePath('/account/orders');
  redirect(`/orders/${orderData.id}`);
}