// src/app/items/[id]/actions.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { initializeTransaction } from '@/lib/paystack';

export type FormState = {
  error?: string;
  success?: boolean;
  url?: string; // We will return the URL
};

// The signature is simplified as it no longer needs the previous state.
export async function createCheckoutSession(formData: FormData): Promise<FormState> {
  console.log("--- 1. SERVER: createCheckoutSession started ---");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to make a purchase.' };
  }

  const itemId = parseInt(formData.get('itemId') as string);
  const amount = parseFloat(formData.get('itemPrice') as string);

  if (isNaN(itemId) || isNaN(amount)) {
    return { error: "Invalid item data provided." };
  }

  console.log(`--- 2. Calling atomic database function 'handle_item_purchase' for item #${itemId}... ---`);
  const { data: newOrderId, error: purchaseError } = await supabase.rpc('handle_item_purchase', {
    p_buyer_id: user.id,
    p_item_id: itemId,
  });

  if (purchaseError) {
    console.error("--- FATAL ERROR during handle_item_purchase RPC:", purchaseError, "---");
    return { error: `Could not complete purchase: ${purchaseError.message}` };
  }

  if (!newOrderId) {
    return { error: 'Failed to create an order, please try again.' };
  }

  console.log(`--- 3. Order #${newOrderId} created. Initializing Paystack... ---`);

  try {
    const paymentData = await initializeTransaction({
      email: user.email!,
      amount: amount * 100,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/orders/payment-callback`,
      metadata: { order_id: newOrderId, user_id: user.id, item_id: itemId },
    });

    if (paymentData.status && paymentData.data.authorization_url) {
      console.log(`--- SUCCESS: Paystack URL created. Returning to client... ---`);
      // Instead of redirecting on the server, we return the URL to the client.
      return { success: true, url: paymentData.data.authorization_url };
    } else {
      return { error: paymentData.message || 'Failed to initialize payment.' };
    }
  } catch (error) {
    console.error("--- FATAL ERROR during Paystack initialization:", error, "---");
    return { error: 'There was a critical issue contacting the payment provider.' };
  }
}

// This function remains the same.
export async function incrementItemView(itemId: number) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('increment_view_count', {
    item_id_to_increment: itemId
  });

  if (error) {
    console.error('Error incrementing view count:', error);
  }
}