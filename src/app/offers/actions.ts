'use server';

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface OfferFormState {
  error: string | null;
  success: boolean;
}

// Action for the buyer to create the initial offer
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

  const { error } = await supabase.from('offers').insert({
    item_id: itemId,
    buyer_id: user.id,
    seller_id: sellerId,
    offer_amount: offerAmount,
    status: 'pending_seller_review',
    last_offer_by: user.id,
  });

  if (error) {
    console.error('Error creating offer:', error);
    return { error: 'Could not submit your offer. Please try again.', success: false };
  }
  
  // TODO: You can add a notification for the seller here

  revalidatePath(`/items/${itemId}`);
  revalidatePath('/account/dashboard/offers');
  return { error: null, success: true };
}

// Action for a user (buyer or seller) to accept an offer
export async function acceptOfferAction(offerId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: offer } = await supabase
    .from('offers')
    .select('*, items(status)')
    .eq('id', offerId)
    .single();

  // Security checks: ensure offer exists, user is authorized, and item is available
  if (!offer || (offer.seller_id !== user.id && offer.buyer_id !== user.id) || offer.items?.status !== 'available') {
    throw new Error('This offer cannot be accepted.');
  }

  // Use a database function to perform the acceptance atomically
  const { data: order, error: rpcError } = await supabase.rpc('accept_offer_and_create_order', {
    p_offer_id: offer.id,
  });

  if (rpcError) {
    console.error('RPC accept_offer_and_create_order error:', rpcError);
    throw new Error('Failed to accept the offer. Please try again.');
  }

  // Revalidate paths and redirect the user to the new order page
  revalidatePath('/account/dashboard/offers');
  revalidatePath(`/items/${offer.item_id}`);
  // @ts-ignore
  redirect(`/orders/${order.id}`);
}


// Action for a user (buyer or seller) to reject an offer
export async function rejectOfferAction(offerId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Determine the correct new status based on who is rejecting
    const { data: offer } = await supabase.from('offers').select('seller_id').eq('id', offerId).single();
    if (!offer) return;
    const newStatus = offer.seller_id === user.id ? 'rejected_by_seller' : 'rejected_by_buyer';

    const { error } = await supabase
        .from('offers')
        .update({ status: newStatus })
        .eq('id', offerId)
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`); // Security check

    if(error){
        throw new Error('Failed to reject offer.');
    }

    revalidatePath('/account/dashboard/offers');
}


// Action for the seller to make a counter-offer
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

    // Get the original offer to ensure the current user is the seller
    const { data: offer, error: fetchError } = await supabase
        .from('offers')
        .select('seller_id, buyer_id')
        .eq('id', offerId)
        .single();
    
    if (fetchError || !offer || offer.seller_id !== user.id) {
        return { error: 'You are not authorized to modify this offer.', success: false };
    }

    // Update the offer with the new amount and status
    const { error: updateError } = await supabase
        .from('offers')
        .update({
            offer_amount: newAmount,
            status: 'pending_buyer_review', // It's now the buyer's turn
            last_offer_by: user.id // The seller made the last offer
        })
        .eq('id', offerId);

    if (updateError) {
        console.error('Counter offer error:', updateError);
        return { error: 'Failed to submit counter-offer.', success: false };
    }
    
    // TODO: You can add a notification for the buyer here

    revalidatePath('/account/dashboard/offers');
    return { error: null, success: true };
}