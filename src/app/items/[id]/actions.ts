// File: app/items/[id]/actions.ts

'use server';

import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Define the shape of our form state
export interface FormState {
  error: string | null;
}

// The server action now has two steps: deduct credits, then create the order.
export async function createCheckoutSession(
  prevState: FormState,
  formData: FormData
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/auth');
  }

  const itemId = formData.get('itemId') as string;
  const sellerId = formData.get('sellerId') as string;
  const finalAmount = formData.get('finalAmount') as string;

  if (!itemId || !sellerId || !finalAmount) {
    return { error: "Missing required item information." };
  }

  if (user.id === sellerId) {
    return { error: "You cannot buy your own item." };
  }
  
  // --- Step 1: Deduct the 25 Credit Purchase Fee ---
  const { data: feeDeducted, error: rpcError } = await supabase.rpc('deduct_purchase_fee', {
    user_id: user.id
  });

  if (rpcError || !feeDeducted) {
    console.error('Purchase Fee RPC Error:', rpcError);
    return { error: 'Could not process purchase fee. You may not have enough credits (25 required).' };
  }

  // --- Step 2: Create the Order in the Database ---
  const { data: orderData, error: insertError } = await supabase
    .from('orders')
    .insert({
      item_id: parseInt(itemId),
      buyer_id: user.id,
      seller_id: sellerId,
      final_amount: parseFloat(finalAmount),
      status: 'pending_payment',
    })
    .select()
    .single();

  if (insertError) {
    // NOTE: In a real app, you would want to refund the 25 credits here if this step fails.
    return { error: `Could not create order: ${insertError.message}` };
  }
  
  // --- Success ---
  revalidatePath('/');
  revalidatePath('/account/orders'); // Revalidate orders page as well
  redirect(`/orders/${orderData.id}`);
}