'use server';

import { createClient } from '../../utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export interface FormState {
  error: string | null;
}

export async function createCheckoutSession(
  prevState: FormState,
  formData: FormData
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/?authModal=true');
  }
  
  // (The rest of the function logic is correct and remains the same)
  const itemId = formData.get('itemId') as string;
  const sellerId = formData.get('sellerId') as string;
  const finalAmount = formData.get('finalAmount') as string;

  if (!itemId || !sellerId || !finalAmount) return { error: "Missing required item information." };
  if (user.id === sellerId) return { error: "You cannot buy your own item." };
  
  const { data: feeDeducted, error: rpcError } = await supabase.rpc('deduct_purchase_fee', { user_id: user.id });
  if (rpcError || !feeDeducted) return { error: 'Could not process purchase fee. You may not have enough credits (25 required).' };

  const { data: orderData, error: insertError } = await supabase
    .from('orders').insert({
      item_id: parseInt(itemId), buyer_id: user.id, seller_id: sellerId,
      final_amount: parseFloat(finalAmount), status: 'pending_payment',
    }).select().single();

  if (insertError) return { error: `Could not create order: ${insertError.message}` };
  
  revalidatePath('/');
  revalidatePath('/account/orders');
  redirect(`/orders/${orderData.id}`);
}