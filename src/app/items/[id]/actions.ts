'use server';

import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Define the shape of our form state
export interface FormState {
  error: string | null;
}

// The server action now uses the FormState interface
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
    console.error('Error creating order:', insertError);
    return { error: `Could not create order: ${insertError.message}` };
  }
  
  revalidatePath('/');
  redirect(`/orders/${orderData.id}`);
}
