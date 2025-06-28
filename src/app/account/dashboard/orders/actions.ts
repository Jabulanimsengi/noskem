'use server';

import { createClient } from '../../../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { COMMISSION_RATE } from '@/lib/constants';
import { createNotification } from '@/app/actions';

export async function confirmReceipt(orderId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return; }

  const { data: order, error } = await supabase.from('orders').select('*, items(seller_id)').eq('id', orderId).single();
  
  if (!order || order.buyer_id !== user.id || !['delivered', 'payment_authorized'].includes(order.status)) { return; }

  const { error: updateError } = await supabase.from('orders').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', orderId);

  if (!updateError) {
      // --- Gamification Logic ---
      const sellerId = order.items?.seller_id;
      if (sellerId) {
          await supabase.rpc('award_badge_if_not_exists', { p_user_id: sellerId, p_badge_type: 'first_sale' });
      }
      await supabase.rpc('award_badge_if_not_exists', { p_user_id: user.id, p_badge_type: 'power_buyer' });
      // --- End Gamification Logic ---
  }

  revalidatePath('/account/dashboard/orders');
}

export async function claimSellerFunds(orderId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return; }

  const { data: order } = await supabase
    .from('orders')
    .select('seller_id, status, final_amount')
    .eq('id', orderId)
    .single();
    
  if (!order || order.seller_id !== user.id || order.status !== 'completed') { return; }

  const commissionAmount = order.final_amount * COMMISSION_RATE;
  const payoutAmount = order.final_amount - commissionAmount;

  const saleTransaction = { 
    user_id: user.id,
    order_id: orderId,
    type: 'sale' as const,
    status: 'completed' as const,
    amount: order.final_amount, 
    description: `Sale of item for order #${orderId}`
  };
  const commissionTransaction = { 
    user_id: user.id,
    order_id: orderId,
    type: 'commission' as const,
    status: 'completed' as const,
    amount: -commissionAmount, 
    description: `${(COMMISSION_RATE * 100)}% commission for order #${orderId}`
  };
  
  const { error: financialError } = await supabase.from('financial_transactions').insert([saleTransaction, commissionTransaction]);

  if (financialError) {
    console.error(`Failed to log financial transactions for order ${orderId}: ${financialError.message}`);
    return; 
  }

  await supabase.rpc('add_credits_to_user', { 
    user_id: user.id, 
    amount_to_add: payoutAmount 
  });
  
  await supabase.from('credit_transactions').insert({ 
    profile_id: user.id, 
    amount: payoutAmount, 
    description: `Payout for completed order #${orderId}` 
  });

  await supabase.from('orders').update({ status: 'funds_paid_out' }).eq('id', orderId);

  revalidatePath('/account/dashboard/orders');
  revalidatePath('/account/dashboard/transactions');
  revalidatePath('/', 'layout');
}


export async function requestReturnAction(orderId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data: order } = await supabase
    .from('orders')
    .select('buyer_id, status')
    .eq('id', orderId)
    .single();
    
  if (!order || order.buyer_id !== user.id || order.status !== 'delivered') {
    throw new Error('This order cannot be disputed at this time.');
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'disputed' })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(`Could not file dispute: ${updateError.message}`);
  }

  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  if (admins) {
    const adminMessage = `A dispute has been filed for Order #${orderId}. Please review.`;
    for (const admin of admins) {
      await createNotification(admin.id, adminMessage, '/admin/orders');
    }
  }

  revalidatePath('/account/dashboard/orders');
}