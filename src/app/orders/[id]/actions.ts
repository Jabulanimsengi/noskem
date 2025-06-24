'use server';

import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createNotification } from '@/app/actions';

// This file contains actions related to orders and offers.
// For clarity, other functions like acceptOfferAction are kept here if they
// are part of the order creation lifecycle.

export async function updateOrderStatus(orderId: number, paystackRef: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    // Step 1: Update the order status to 'payment_authorized'
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

    // FIX: Update the associated item's status to 'sold'
    const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'sold' })
        .eq('id', order.item_id);

    if (itemError) {
        console.error(`Critical error: Failed to update item status for order ${orderId}`);
    }

    // FIX: Notify all agents that a new task is ready for assessment.
    try {
        const { data: agents } = await supabase.from('profiles').select('id').eq('role', 'agent');
        if (agents) {
            const agentMessage = `New Task: Order #${orderId} has been paid and requires assessment.`;
            for (const agent of agents) {
                await createNotification(agent.id, agentMessage, '/agent/dashboard');
            }
        }
    } catch (notificationError) {
        console.error("Failed to create notifications for agents:", notificationError);
    }


    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/account/dashboard/orders');
    revalidatePath('/agent/dashboard'); // Revalidate agent dashboard as well
    return { success: true };
}


// Other actions from this file are included below for completeness.
// No changes are needed to them.

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
  
  const isUserInvolved = user.id === offer.seller_id || user.id === offer.buyer_id;
  const isTheirTurnToAccept = offer.last_offer_by !== user.id;

  if (!isUserInvolved || !isTheirTurnToAccept) {
    throw new Error("You are not authorized to accept this offer at this time.");
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
  
  const trueBuyerId = offer.buyer_id;
  const trueSellerId = offer.seller_id;
  
  try {
    const buyerMessage = `Your offer for "${item.title}" was accepted! Please proceed to payment.`;
    await createNotification(trueBuyerId, buyerMessage, `/orders/${newOrderId}`);
    
    const sellerMessage = `Your item "${item.title}" has been sold! We are waiting for the buyer to complete payment.`;
    await createNotification(trueSellerId, sellerMessage, `/account/dashboard/orders`);

  } catch (notificationError) {
      console.error("Failed to create notification for accepted offer:", notificationError);
  }

  revalidatePath('/account/dashboard/offers');
  revalidatePath(`/items/${offer.item_id}`);
  
  if (user.id === trueBuyerId) {
    redirect(`/orders/${newOrderId}`);
  }
}