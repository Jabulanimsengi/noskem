'use server';

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createNotification } from '../components/actions';

export interface OfferFormState {
  error: string | null;
  success: boolean;
}

// This function is correct and does not need changes.
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


// --- FIX: This function has been rewritten to be more robust. ---
export async function acceptOfferAction(offerId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required to accept an offer.");
  }

  // Step 1: Fetch the offer itself, without any joins.
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (offerError || !offer) {
    throw new Error("Offer not found or there was an error fetching it.");
  }

  // Step 2: Perform authorization checks. Only the user who received the offer can accept.
  if (offer.last_offer_by === user.id) {
    throw new Error("You cannot accept your own offer.");
  }
  if (offer.seller_id !== user.id) {
    throw new Error("Only the item's seller can accept this offer.");
  }
  
  // Step 3: Fetch the related item in a separate, simple query.
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id, title, status')
    .eq('id', offer.item_id)
    .single();

  if (itemError || !item) {
    throw new Error("The item associated with this offer could not be found.");
  }
  
  // Step 4: Check if the item is still available for sale.
  if (item.status !== 'available') {
    throw new Error(`This offer cannot be accepted because the item is no longer available (status: ${item.status}).`);
  }

  // Step 5: If all checks pass, call the database function to finalize the process.
  // The function name 'accept_offer_and_create_order' matches the one you provided.
  const { data: orderData, error: rpcError } = await supabase.rpc('accept_offer_and_create_order', {
    p_offer_id: offer.id,
  });

  if (rpcError || !orderData || orderData.length === 0) {
    throw new Error(`Failed to create order from offer: ${rpcError?.message || 'Unknown database RPC error'}`);
  }
  
  const newOrder = orderData[0];
  try {
    const message = `Your offer for "${item.title}" was accepted! Please proceed to payment.`;
    await createNotification(offer.buyer_id, message, `/orders/${newOrder.id}`);
  } catch (notificationError) {
      console.error("Failed to create notification for accepted offer:", notificationError);
  }

  revalidatePath('/account/dashboard/offers');
  revalidatePath(`/items/${offer.item_id}`);
  redirect(`/orders/${newOrder.id}`);
}


// FIX: This function has also been refactored for better reliability.
export async function rejectOfferAction(offerId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: offer } = await supabase.from('offers').select('*').eq('id', offerId).single();
    if (!offer) return;
    
    // Check if user is part of the transaction
    if (offer.seller_id !== user.id && offer.buyer_id !== user.id) {
        return; 
    }

    const { data: item } = await supabase.from('items').select('title').eq('id', offer.item_id).single();
    if (!item) return;

    const newStatus = offer.seller_id === user.id ? 'rejected_by_seller' : 'rejected_by_buyer';
    await supabase.from('offers').update({ status: newStatus }).eq('id', offerId);
    
    try {
        const recipientId = offer.seller_id === user.id ? offer.buyer_id : offer.seller_id;
        const message = `Your offer for "${item.title}" was rejected.`;
        await createNotification(recipientId, message, '/account/dashboard/offers');
    } catch (notificationError) {
        console.error("Failed to create notification for rejected offer:", notificationError);
    }

    revalidatePath('/account/dashboard/offers');
}


// FIX: This function has also been refactored for better reliability.
export async function counterOfferAction(prevState: OfferFormState, formData: FormData): Promise<OfferFormState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'You must be logged in.', success: false };
    }

    const offerId = parseInt(formData.get('offerId') as string);
    const newAmount = parseFloat(formData.get('newAmount') as string);

    if (isNaN(offerId) || isNaN(newAmount) || newAmount <= 0) {
        return { error: 'Invalid data provided.', success: false };
    }

    const { data: offer, error: fetchError } = await supabase.from('offers').select('*').eq('id', offerId).single();
    
    if (fetchError || !offer || (offer.seller_id !== user.id && offer.buyer_id !== user.id) || offer.last_offer_by === user.id) {
        return { error: 'You are not authorized to modify this offer at this time.', success: false };
    }
    
    const { data: item } = await supabase.from('items').select('title').eq('id', offer.item_id).single();
    if (!item) {
        return { error: 'Associated item could not be found.', success: false };
    }

    const recipientId = offer.seller_id === user.id ? offer.buyer_id : offer.seller_id;
    const newStatus = offer.seller_id === user.id ? 'pending_buyer_review' : 'pending_seller_review';

    await supabase
        .from('offers')
        .update({ offer_amount: newAmount, status: newStatus, last_offer_by: user.id })
        .eq('id', offerId);
    
    try {
        const message = `You received a counter-offer of R${newAmount.toFixed(2)} for "${item.title}".`;
        await createNotification(recipientId, message, '/account/dashboard/offers');
    } catch(notificationError) {
        console.error("Failed to create notification for counter-offer:", notificationError);
    }

    revalidatePath('/account/dashboard/offers');
    return { error: null, success: true };
}