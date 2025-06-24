'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
// FIX: Correct the import path to the new centralized actions file
import { createNotification } from '@/app/actions';

export interface OfferFormState {
  error: string | null;
  success: boolean;
}

export async function createOfferAction(prevState: OfferFormState, formData: FormData): Promise<OfferFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to make an offer.', success: false };
  }

  const offerAmount = parseFloat(formData.get('offerAmount') as string);
  const itemId = parseInt(formData.get('itemId') as string);
  const sellerId = formData.get('sellerId') as string;

  if (isNaN(offerAmount) || isNaN(itemId) || !sellerId) {
    return { error: 'Invalid data provided.', success: false };
  }
  
  if (user.id === sellerId) {
    return { error: "You cannot make an offer on your own item.", success: false };
  }

  const { data: itemData } = await supabase.from('items').select('title').eq('id', itemId).single();
  if (!itemData) {
      return { error: 'Could not find the item.', success: false };
  }

  const { error } = await supabase.from('offers').insert({
    item_id: itemId,
    buyer_id: user.id,
    seller_id: sellerId,
    offer_amount: offerAmount,
    status: 'pending_seller_review',
    last_offer_by: user.id,
  });

  if (error) {
    return { error: `Could not submit your offer: ${error.message}`, success: false };
  }
  
  try {
    const message = `You received a new offer of R${offerAmount.toFixed(2)} for your item: "${itemData.title}"`;
    await createNotification(sellerId, message, '/account/dashboard/offers');
  } catch (notificationError) {
      console.error("Failed to create notification for new offer:", notificationError);
  }

  revalidatePath(`/items/${itemId}`);
  revalidatePath('/account/dashboard/offers');
  return { error: null, success: true };
}


export async function acceptOfferAction(offerId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required to accept an offer.");
  }

  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (offerError || !offer) {
    throw new Error("Offer not found or there was an error fetching it.");
  }
  if (offer.seller_id !== user.id) {
    throw new Error("Only the item's seller can accept this offer.");
  }
  
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id, title, status')
    .eq('id', offer.item_id)
    .single();

  if (itemError || !item) {
    throw new Error("The item associated with this offer could not be found.");
  }
  if (item.status !== 'available') {
    throw new Error(`This offer cannot be accepted because the item is no longer available (status: ${item.status}).`);
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc('accept_offer_and_create_order', {
    p_offer_id: offer.id,
  });
  
  const newOrderId = rpcData?.[0]?.id;

  if (rpcError || typeof newOrderId !== 'number') {
    throw new Error(`Failed to create order from offer: ${rpcError?.message || 'Did not receive a valid order ID from the database.'}`);
  }
  
  try {
    const message = `Your offer for "${item.title}" was accepted! Please proceed to payment.`;
    await createNotification(offer.buyer_id, message, `/orders/${newOrderId}`);
  } catch (notificationError) {
      console.error("Failed to create notification for accepted offer:", notificationError);
  }

  revalidatePath('/account/dashboard/offers');
  revalidatePath(`/items/${offer.item_id}`);
  redirect(`/orders/${newOrderId}`);
}

// This action is called by the PaystackButton after a successful payment
export async function updateOrderStatus(orderId: number, paystackRef: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    // Update the order status to 'payment_authorized'
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({ status: 'payment_authorized', paystack_ref: paystackRef })
        .eq('id', orderId)
        .eq('buyer_id', user.id)
        .select('item_id, seller_id')
        .single();

    if (orderError) {
        return { success: false, error: `Failed to update order: ${orderError.message}` };
    }
    if (!order) {
        return { success: false, error: 'Order not found or you are not the buyer.' };
    }

    // Also update the item's status to 'sold'
    await supabase
        .from('items')
        .update({ status: 'sold' })
        .eq('id', order.item_id);

    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/account/dashboard/orders');
    return { success: true };
}