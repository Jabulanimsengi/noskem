/**
 * CODE REVIEW UPDATE
 * ------------------
 * This file has been updated based on the AI code review.
 *
 * Change Made:
 * - Suggestion #43 (Security): Removed the `payoutAmount` parameter from `claimSellerFunds`.
 * The payout amount is now calculated securely on the server by fetching the order's
 * final amount and applying the commission rate. This prevents a critical vulnerability
 * where a user could tamper with the client-side request to claim more funds.
 */
'use server';

import { createClient } from '../../../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { COMMISSION_RATE } from '@/lib/constants'; // Import constant for calculation

export async function confirmReceipt(orderId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return; }

  const { data: order } = await supabase.from('orders').select('buyer_id, status').eq('id', orderId).single();
  if (!order || order.buyer_id !== user.id || order.status !== 'payment_authorized') { return; }

  await supabase.from('orders').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', orderId);
  revalidatePath('/account/dashboard/orders');
}

// The insecure `payoutAmount` parameter has been removed.
export async function claimSellerFunds(orderId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return; }

  // Fetch the full order to get the final_amount for server-side calculation
  const { data: order } = await supabase
    .from('orders')
    .select('seller_id, status, final_amount')
    .eq('id', orderId)
    .single();
    
  if (!order || order.seller_id !== user.id || order.status !== 'completed') { return; }

  // Securely calculate the payout amount on the server
  const payoutAmount = Math.round(order.final_amount * (1 - COMMISSION_RATE));

  // Use an RPC to add credits, which is generally safer for financial operations
  const { error: rpcError } = await supabase.rpc('add_credits_to_user', { 
    user_id: user.id, 
    amount_to_add: payoutAmount 
  });
  if (rpcError) {
    // Optionally handle the error, e.g., by logging it
    console.error(`Failed to claim funds for order ${orderId}: ${rpcError.message}`);
    return;
  }

  // Log the transaction for auditing purposes
  await supabase.from('credit_transactions').insert({ 
    profile_id: user.id, 
    amount: payoutAmount, 
    description: `Payout for completed order #${orderId}` 
  });

  // Update the order status to prevent double claims
  await supabase.from('orders').update({ status: 'funds_paid_out' }).eq('id', orderId);

  revalidatePath('/account/dashboard/orders');
  revalidatePath('/', 'layout'); // Revalidate layout to update credit balance in header
}