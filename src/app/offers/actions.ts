// File: src/app/offers/actions.ts

'use server';

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';

// State definition for the form
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

  // Insert the new offer
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
  
  // Here you would also create a notification for the seller

  revalidatePath(`/items/${itemId}`);
  return { error: null, success: true };
}

// Action for either party to update an existing offer (accept, reject, counter)
export async function updateOfferAction(formData: FormData) {
    // This is where the logic for accepting, rejecting, and making counter-offers will go.
    // We will build this out in the next steps when creating the dashboard view for offers.
    console.log("Update offer action called");
}