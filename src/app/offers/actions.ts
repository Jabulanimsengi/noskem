// src/app/offers/actions.ts
'use server';

import { createClient } from '@/utils/supabase/server'; // Corrected import
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createNotification } from '@/app/actions';

export interface OfferFormState {
  error: string | null;
  success: boolean;
}

const CreateOfferSchema = z.object({
  offerAmount: z.coerce.number().positive({ message: 'Offer amount must be a positive number.' }),
  itemId: z.coerce.number(),
  sellerId: z.string().uuid(),
});

export async function createOfferAction(prevState: OfferFormState, formData: FormData): Promise<OfferFormState> {
  const supabase = createClient();
  // ... rest of the function is correct ...
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to make an offer.', success: false };
  }

  const validatedFields = CreateOfferSchema.safeParse({
    offerAmount: formData.get('offerAmount'),
    itemId: formData.get('itemId'),
    sellerId: formData.get('sellerId'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.offerAmount?.[0] || 'Invalid data provided.',
      success: false,
    };
  }

  const { offerAmount, itemId, sellerId } = validatedFields.data;

  if (user.id === sellerId) {
    return { error: "You cannot make an offer on your own item.", success: false };
  }

  const { data: itemData, error: itemError } = await supabase.from('items').select('title').eq('id', itemId).single();

  if (itemError || !itemData) {
    return { error: 'Could not find the associated item.', success: false };
  }

  const { error: insertError } = await supabase.from('offers').insert({
    item_id: itemId,
    buyer_id: user.id,
    seller_id: sellerId,
    offer_amount: offerAmount,
    status: 'pending_seller_review',
    last_offer_by: user.id,
  });

  if (insertError) {
    console.error("Supabase insert error:", insertError.message);
    return { error: 'A database error occurred. Could not submit your offer.', success: false };
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
  const supabase = createClient();
  // ... rest of the function ...
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

  if (rpcError || !rpcData) {
      throw new Error(`Failed to create order from offer: ${rpcError?.message || 'Did not receive a valid order ID from the database.'}`);
  }

  const newOrderId = rpcData?.[0]?.id;

  if (typeof newOrderId !== 'number') {
      throw new Error('Did not receive a valid order ID from the database.');
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

export async function rejectOfferAction(offerId: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: offer } = await supabase.from('offers').select('*').eq('id', offerId).single();
    if (!offer) return;
    
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

export async function counterOfferAction(prevState: OfferFormState, formData: FormData): Promise<OfferFormState> {
    const supabase = createClient();
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