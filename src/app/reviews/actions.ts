'use server';

import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ReviewFormState {
  error: string | null;
  success: boolean;
}

export async function submitReviewAction(prevState: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to leave a review.', success: false };
  }

  const orderId = parseInt(formData.get('orderId') as string);
  const rating = parseInt(formData.get('rating') as string);
  const comment = formData.get('comment') as string;

  if (isNaN(orderId) || isNaN(rating)) {
    return { error: 'Invalid data provided.', success: false };
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('buyer_id, seller_id')
    .eq('id', orderId)
    .single();

  if (orderError || !order || order.buyer_id !== user.id) {
    return { error: 'You are not authorized to review this order.', success: false };
  }
  
  const { error: insertError } = await supabase.from('reviews').insert({
    order_id: orderId,
    reviewer_id: user.id,
    seller_id: order.seller_id,
    rating: rating,
    comment: comment,
  });

  if (insertError) {
    if (insertError.code === '23505') {
        return { error: 'You have already submitted a review for this order.', success: false };
    }
    return { error: 'Failed to submit your review.', success: false };
  }

  revalidatePath('/account/dashboard/orders');
  // Revalidate the seller's public profile page to show the new review
  const { data: sellerProfile } = await supabase.from('profiles').select('username').eq('id', order.seller_id).single();
  if (sellerProfile?.username) {
    revalidatePath(`/sellers/${sellerProfile.username}`);
  }
  
  return { success: true, error: null };
}