'use server';

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createNotification } from '../components/actions';

export interface OfferFormState {
  error: string | null;
  success: boolean;
}

// This function is already correct
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
    return { error: 'Could not submit your offer. Please try again.', success: false };
  }
  
  const message = `You received a new offer of R${offerAmount.toFixed(2)} for your item: "${itemData.title}"`;
  await createNotification(sellerId, message, '/account/dashboard/offers');

  revalidatePath(`/items/${itemId}`);
  revalidatePath('/account/dashboard/offers');
  return { error: null, success: true };
}

export async function acceptOfferAction(offerId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: offer } = await supabase
    .from('offers')
    .select('*, items(id, title, status)')
    .eq('id', offerId)
    .single();

  // Corrected: Check if items is an array and access the first element
  const item = offer?.items?.[0];

  if (!offer || !item || (offer.seller_id !== user.id && offer.buyer_id !== user.id) || item.status !== 'available') {
    throw new Error('This offer cannot be accepted.');
  }

  // Corrected: Handle array returned by RPC
  const { data: orderData, error: rpcError } = await supabase.rpc('accept_offer_and_create_order', {
    p_offer_id: offer.id,
  });

  if (rpcError || !orderData || orderData.length === 0) {
    throw new Error('Failed to accept the offer. Please try again.');
  }
  
  const newOrder = orderData[0];

  const message = `Your offer for "${item.title}" was accepted! Proceed to payment.`;
  await createNotification(offer.buyer_id, message, `/orders/${newOrder.id}`);

  revalidatePath('/account/dashboard/offers');
  revalidatePath(`/items/${offer.item_id}`);
  redirect(`/orders/${newOrder.id}`);
}


export async function rejectOfferAction(offerId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: offer } = await supabase.from('offers').select('seller_id, buyer_id, items(title)').eq('id', offerId).single();
    
    // Corrected: Check if items is an array and access the first element
    const item = offer?.items?.[0];
    if (!offer || !item) return;

    const newStatus = offer.seller_id === user.id ? 'rejected_by_seller' : 'rejected_by_buyer';

    const { error } = await supabase
        .from('offers')
        .update({ status: newStatus })
        .eq('id', offerId)
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`);

    if(error){
        throw new Error('Failed to reject offer.');
    }

    const recipientId = offer.seller_id === user.id ? offer.buyer_id : offer.seller_id;
    const message = `Your offer for "${item.title}" was rejected.`;
    await createNotification(recipientId, message, '/account/dashboard/offers');

    revalidatePath('/account/dashboard/offers');
}


export async function counterOfferAction(prevState: OfferFormState, formData: FormData): Promise<OfferFormState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'You must be logged in.', success: false };
    }

    const offerId = parseInt(formData.get('offerId') as string);
    const newAmount = parseFloat(formData.get('newAmount') as string);

    if (isNaN(offerId) || isNaN(newAmount)) {
        return { error: 'Invalid data provided.', success: false };
    }

    const { data: offer, error: fetchError } = await supabase
        .from('offers')
        .select('seller_id, buyer_id, items(title)')
        .eq('id', offerId)
        .single();
    
    // Corrected: Check if items is an array and access the first element
    const item = offer?.items?.[0];

    if (fetchError || !offer || !item || offer.seller_id !== user.id) {
        return { error: 'You are not authorized to modify this offer.', success: false };
    }

    const { error: updateError } = await supabase
        .from('offers')
        .update({
            offer_amount: newAmount,
            status: 'pending_buyer_review',
            last_offer_by: user.id
        })
        .eq('id', offerId);

    if (updateError) {
        return { error: 'Failed to submit counter-offer.', success: false };
    }
    
    const message = `You received a counter-offer of R${newAmount.toFixed(2)} for "${item.title}".`;
    await createNotification(offer.buyer_id, message, '/account/dashboard/offers');

    revalidatePath('/account/dashboard/offers');
    return { error: null, success: true };
}