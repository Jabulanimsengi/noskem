// File: app/account/dashboard/orders/actions.ts

'use server';

import { createClient } from '../../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

// This action is called by the buyer to confirm they have received the item.
export async function confirmReceipt(orderId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return; }

  const { data: order } = await supabase.from('orders').select('buyer_id, status').eq('id', orderId).single();
  if (!order || order.buyer_id !== user.id || order.status !== 'payment_authorized') { return; }

  await supabase.from('orders').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', orderId);
  revalidatePath('/account/dashboard/orders');
}

// This action is called by the seller to claim their funds.
export async function claimSellerFunds(orderId: number, payoutAmount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return; }

  const { data: order } = await supabase.from('orders').select('seller_id, status').eq('id', orderId).single();
  if (!order || order.seller_id !== user.id || order.status !== 'completed') { return; }

  await supabase.rpc('add_credits_to_user', { user_id: user.id, amount_to_add: payoutAmount });
  await supabase.from('credit_transactions').insert({ profile_id: user.id, amount: payoutAmount, description: `Payout for completed order #${orderId}` });
  await supabase.from('orders').update({ status: 'funds_paid_out' }).eq('id', orderId);

  revalidatePath('/account/dashboard/orders');
}